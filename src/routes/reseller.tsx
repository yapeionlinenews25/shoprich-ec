import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/app/ProductCard";
import { DollarSign, TrendingUp, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reseller")({
  component: ResellerDashboard,
});

function ResellerDashboard() {
  const { user, roles } = useAuth();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("products").select("id, title, price, image_url, category, vendor_id").eq("status", "active").limit(24);
      setProducts((p ?? []) as ProductCardData[]);
      const { data: c } = await supabase.from("commissions").select("*").eq("beneficiary_id", user.id).eq("beneficiary_role", "reseller").order("created_at", { ascending: false });
      setCommissions(c ?? []);
    })();
  }, [user?.id]);

  if (!user) return <AppShell><p>Please <Link to="/auth" className="text-accent underline">sign in</Link>.</p></AppShell>;
  if (!roles.includes("reseller")) return <AppShell><p>You're not a reseller yet. <Link to="/account" className="text-accent underline">Become one</Link>.</p></AppShell>;

  const total = commissions.reduce((s, c) => s + Number(c.amount), 0);
  const pending = commissions.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Reseller dashboard</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={DollarSign} label="Total earned" value={`$${total.toFixed(2)}`} />
        <Stat icon={TrendingUp} label="Pending payout" value={`$${pending.toFixed(2)}`} />
        <Stat icon={LinkIcon} label="Sales" value={commissions.length} />
      </div>

      <h2 className="mt-8 font-semibold">Recent commissions</h2>
      <div className="mt-3 space-y-2">
        {commissions.length === 0 && <p className="text-xs text-muted-foreground">No commissions yet. Share product links to start earning.</p>}
        {commissions.map((c) => (
          <div key={c.id} className="glass flex items-center justify-between rounded-2xl p-3 text-sm">
            <span>{new Date(c.created_at).toLocaleDateString()} · {c.status}</span>
            <span className="font-semibold gradient-text">${Number(c.amount).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-semibold">Products to promote</h2>
      <p className="text-xs text-muted-foreground mb-3">Open any product to copy your unique referral link & QR code.</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      <button onClick={() => toast.info("Payout request submitted (demo)")} className="mt-6 rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glass-hover">
        Request payout
      </button>
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
