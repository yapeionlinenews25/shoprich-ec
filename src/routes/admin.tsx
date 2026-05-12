import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Package, ShoppingBag, DollarSign, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, roles } = useAuth();
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);

  const load = async () => {
    const [{ count: users }, { count: products }, { data: o }, { data: st }, { data: cfg }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("vendor_stores").select("*").order("created_at", { ascending: false }),
      supabase.from("platform_settings").select("*").eq("id", 1).single(),
    ]);
    setOrders(o ?? []);
    setStores(st ?? []);
    setSettings(cfg);
    const revenue = (o ?? []).filter((x) => x.status !== "pending").reduce((s, x) => s + Number(x.platform_fee), 0);
    setStats({ users: users ?? 0, products: products ?? 0, orders: (o ?? []).length, revenue });
  };
  useEffect(() => { load(); }, [user?.id]);

  if (!user) return (
    <AppShell>
      <div className="glass-strong mx-auto max-w-md rounded-3xl p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-3 text-xl font-bold">Sign in required</h1>
        <p className="mt-1 text-sm text-muted-foreground">Please sign in with an admin account to access the dashboard.</p>
        <Link to="/auth" className="mt-4 inline-block rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glass-hover">Sign in</Link>
      </div>
    </AppShell>
  );
  if (!roles.includes("admin"))
    return (
      <AppShell>
        <div className="glass-strong mx-auto max-w-md rounded-3xl p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-400" />
          <h1 className="mt-3 text-xl font-bold">Admin access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({user.email}) doesn't have the admin role yet. Only the platform owner can grant it.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">If this is your platform, contact support to upgrade your account.</p>
          <Link to="/" className="mt-5 inline-block glass glass-hover rounded-full px-5 py-2.5 text-sm font-semibold">Back to home</Link>
        </div>
      </AppShell>
    );

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("platform_settings").update({
      platform_fee_pct: Number(settings.platform_fee_pct),
      notification_email: settings.notification_email,
      notification_telegram_chat_id: settings.notification_telegram_chat_id,
    }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  };

  const setStoreStatus = async (id: string, status: string) => {
    await supabase.from("vendor_stores").update({ status: status as any }).eq("id", id);
    load();
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Users} label="Users" value={stats.users} />
        <Stat icon={Package} label="Products" value={stats.products} />
        <Stat icon={ShoppingBag} label="Orders" value={stats.orders} />
        <Stat icon={DollarSign} label="Platform revenue" value={`$${stats.revenue.toFixed(2)}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass-strong rounded-3xl p-6">
          <h2 className="font-semibold mb-3">Vendor stores</h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {stores.map((s) => (
              <div key={s.id} className="glass flex items-center justify-between rounded-xl p-3 text-sm">
                <div><div className="font-semibold">{s.name}</div><div className="text-xs text-muted-foreground">{s.country ?? "—"} · {s.status}</div></div>
                <div className="flex gap-1">
                  {["pending", "active", "suspended"].map((st) => (
                    <button key={st} onClick={() => setStoreStatus(s.id, st)} className={`rounded-lg px-2 py-1 text-[10px] capitalize ${s.status === st ? "gradient-primary text-primary-foreground" : "glass glass-hover"}`}>{st}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-6 font-semibold mb-3">Recent orders</h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {orders.map((o) => (
              <Link to="/orders/$id" params={{ id: o.id }} key={o.id} className="glass glass-hover flex items-center justify-between rounded-xl p-3 text-sm">
                <span>{o.order_number} · <span className="text-xs text-muted-foreground">{o.status}</span></span>
                <span className="font-semibold">${Number(o.total).toFixed(2)}</span>
              </Link>
            ))}
          </div>
        </div>

        <form onSubmit={saveSettings} className="glass-strong h-fit rounded-3xl p-6 space-y-3">
          <h2 className="font-semibold">Platform settings</h2>
          <label className="block text-xs text-muted-foreground">Platform fee % (deducted from each order)
            <input type="number" step="0.1" value={settings?.platform_fee_pct ?? ""} onChange={(e) => setSettings({ ...settings, platform_fee_pct: e.target.value })} className="glass mt-1 w-full rounded-xl px-4 py-2.5 text-sm" />
          </label>
          <label className="block text-xs text-muted-foreground">Admin notification email (Gmail)
            <input type="email" value={settings?.notification_email ?? ""} onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })} className="glass mt-1 w-full rounded-xl px-4 py-2.5 text-sm" />
          </label>
          <label className="block text-xs text-muted-foreground">Admin Telegram chat ID
            <input value={settings?.notification_telegram_chat_id ?? ""} onChange={(e) => setSettings({ ...settings, notification_telegram_chat_id: e.target.value })} className="glass mt-1 w-full rounded-xl px-4 py-2.5 text-sm" />
          </label>
          <button className="rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glass-hover">Save</button>
        </form>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="glass glass-hover rounded-2xl p-4">
      <Icon className="h-4 w-4 text-accent" />
      <div className="mt-2 text-xl font-bold gradient-text">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
