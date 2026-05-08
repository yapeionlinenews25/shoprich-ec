import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  component: Account,
});

function Account() {
  const { user, roles, refreshRoles } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(p);
      const { data: o } = await supabase.from("orders").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(10);
      setOrders(o ?? []);
    })();
  }, [user?.id]);

  if (!user) return <AppShell><p className="text-center text-muted-foreground">Please <Link to="/auth" className="text-accent underline">sign in</Link>.</p></AppShell>;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name,
      contact_email: profile.contact_email,
      telegram_chat_id: profile.telegram_chat_id,
      country: profile.country,
    }).eq("user_id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved. Notifications will go to these channels.");
  };

  const becomeRole = async (role: "vendor" | "reseller") => {
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    await refreshRoles();
    toast.success(`You are now a ${role}!`);
  };

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">My account</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="glass-strong rounded-3xl p-6 space-y-3">
          <h2 className="font-semibold">Profile & notification channels</h2>
          <input className="glass w-full rounded-xl px-4 py-3 text-sm" placeholder="Display name"
            value={profile?.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
          <input className="glass w-full rounded-xl px-4 py-3 text-sm" placeholder="Contact email (for order emails)"
            value={profile?.contact_email ?? ""} onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })} />
          <input className="glass w-full rounded-xl px-4 py-3 text-sm" placeholder="Telegram chat ID (for Telegram alerts)"
            value={profile?.telegram_chat_id ?? ""} onChange={(e) => setProfile({ ...profile, telegram_chat_id: e.target.value })} />
          <input className="glass w-full rounded-xl px-4 py-3 text-sm" placeholder="Country"
            value={profile?.country ?? ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
          <p className="text-xs text-muted-foreground">Tip: get your Telegram chat ID by messaging @userinfobot on Telegram.</p>
          <button disabled={busy} className="rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glass-hover">
            {busy ? "Saving..." : "Save"}
          </button>
        </form>

        <div className="glass-strong rounded-3xl p-6">
          <h2 className="font-semibold">Your roles</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.map((r) => <span key={r} className="glass rounded-full px-3 py-1 text-xs capitalize">{r}</span>)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {!roles.includes("vendor") && (
              <button onClick={() => becomeRole("vendor")} className="glass glass-hover rounded-xl p-4 text-left">
                <div className="text-sm font-semibold">Become a vendor</div>
                <div className="text-xs text-muted-foreground">Open a global store</div>
              </button>
            )}
            {!roles.includes("reseller") && (
              <button onClick={() => becomeRole("reseller")} className="glass glass-hover rounded-xl p-4 text-left">
                <div className="text-sm font-semibold">Become a reseller</div>
                <div className="text-xs text-muted-foreground">Earn commissions</div>
              </button>
            )}
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-sm">Recent orders</h3>
            <div className="mt-2 space-y-2">
              {orders.length === 0 && <p className="text-xs text-muted-foreground">No orders yet.</p>}
              {orders.map((o) => (
                <Link to="/orders/$id" params={{ id: o.id }} key={o.id} className="glass glass-hover flex items-center justify-between rounded-xl p-3 text-sm">
                  <span>{o.order_number} · <span className="text-xs text-muted-foreground">{o.status}</span></span>
                  <span className="font-semibold">${Number(o.total).toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
