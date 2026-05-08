import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      setOrder(o);
      const { data: oi } = await supabase.from("order_items").select("*").eq("order_id", id);
      setItems(oi ?? []);
    })();
  }, [id, user?.id]);

  if (!user) return <AppShell><p className="text-center text-muted-foreground">Please <Link to="/auth" className="text-accent underline">sign in</Link>.</p></AppShell>;
  if (!order) return <AppShell><p className="text-center text-muted-foreground">Loading…</p></AppShell>;

  const statusColor: Record<string, string> = {
    pending: "bg-muted", paid: "bg-accent text-accent-foreground", processing: "bg-primary text-primary-foreground",
    shipped: "bg-secondary text-secondary-foreground", delivered: "bg-emerald-500", cancelled: "bg-destructive",
  };

  return (
    <AppShell>
      <div className="glass-strong rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{order.order_number}</h1>
            <p className="text-xs text-muted-foreground">Placed {new Date(order.created_at).toLocaleString()}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[order.status] ?? "bg-muted"}`}>{order.status}</span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold">Shipping</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.shipping_name}<br/>{order.shipping_address}<br/>{order.shipping_city}, {order.shipping_country}<br/>{order.shipping_phone}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold">Payment</h3>
            <p className="mt-1 text-sm text-muted-foreground">{order.payment_method ?? "—"} · Ref: {order.payment_reference ?? "—"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="glass rounded-lg p-2"><div className="text-muted-foreground">Subtotal</div><div className="font-semibold">${Number(order.subtotal).toFixed(2)}</div></div>
              <div className="glass rounded-lg p-2"><div className="text-muted-foreground">Platform fee</div><div className="font-semibold">${Number(order.platform_fee).toFixed(2)}</div></div>
              <div className="glass rounded-lg p-2"><div className="text-muted-foreground">Reseller</div><div className="font-semibold">${Number(order.reseller_commission).toFixed(2)}</div></div>
              <div className="glass rounded-lg p-2"><div className="text-muted-foreground">Vendor payout</div><div className="font-semibold">${Number(order.vendor_payout).toFixed(2)}</div></div>
            </div>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-semibold">Items</h3>
        <div className="mt-2 space-y-2">
          {items.map((i) => (
            <div key={i.id} className="glass flex items-center justify-between rounded-2xl p-3 text-sm">
              <span className="truncate">{i.title} × {i.quantity}</span>
              <span className="font-semibold">${Number(i.line_total).toFixed(2)}</span>
            </div>
          ))}
        </div>
        {order.tracking_number && (
          <p className="mt-4 text-sm">Tracking: <span className="font-semibold">{order.tracking_number}</span></p>
        )}
        <Link to="/account" className="mt-6 inline-block text-sm text-accent underline">Back to account</Link>
      </div>
    </AppShell>
  );
}
