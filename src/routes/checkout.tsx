import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { finalizeOrderPayment } from "@/lib/payments.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — ShopRich EC" }] }),
  component: Checkout,
});

function Checkout() {
  const cart = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const finalize = useServerFn(finalizeOrderPayment);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", country: "", phone: "", method: "card" });

  if (!user)
    return (
      <AppShell>
        <p className="text-center text-muted-foreground">Please <Link to="/auth" className="text-accent underline">sign in</Link> to checkout.</p>
      </AppShell>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.items.length === 0) return toast.error("Cart is empty");
    setBusy(true);
    try {
      // Get platform fee
      const { data: settings } = await supabase.from("platform_settings").select("*").eq("id", 1).single();
      const feePct = Number(settings?.platform_fee_pct ?? 5) / 100;

      // Compute totals + per-item splits
      const items = cart.items.map((i) => {
        const unit = Number(i.product?.price ?? 0);
        const line = unit * i.quantity;
        const platform_fee = +(line * feePct).toFixed(2);
        const reseller_commission = 0; // we'll fetch product reseller_pct below
        const vendor_payout = +(line - platform_fee - reseller_commission).toFixed(2);
        return {
          product_id: i.product_id,
          vendor_id: i.product?.vendor_id ?? "",
          reseller_id: i.reseller_id,
          title: i.product?.title ?? "",
          unit_price: unit,
          quantity: i.quantity,
          line_total: line,
          platform_fee,
          reseller_commission,
          vendor_payout,
        };
      });

      // Pull reseller commission %s for any items with reseller
      const productIds = items.map((i) => i.product_id);
      const { data: prods } = await supabase.from("products").select("id, reseller_commission_pct").in("id", productIds);
      const pctMap = new Map((prods ?? []).map((p) => [p.id, Number(p.reseller_commission_pct)]));
      for (const it of items) {
        if (it.reseller_id) {
          const pct = (pctMap.get(it.product_id) ?? 0) / 100;
          it.reseller_commission = +(it.line_total * pct).toFixed(2);
          it.vendor_payout = +(it.line_total - it.platform_fee - it.reseller_commission).toFixed(2);
        }
      }

      const subtotal = items.reduce((s, i) => s + i.line_total, 0);
      const platform_fee = items.reduce((s, i) => s + i.platform_fee, 0);
      const reseller_commission = items.reduce((s, i) => s + i.reseller_commission, 0);
      const vendor_payout = items.reduce((s, i) => s + i.vendor_payout, 0);

      // Create order
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          subtotal, platform_fee, reseller_commission, vendor_payout, total: subtotal,
          shipping_name: form.name, shipping_address: form.address, shipping_city: form.city,
          shipping_country: form.country, shipping_phone: form.phone, payment_method: form.method,
        })
        .select("*")
        .single();
      if (oErr) throw oErr;

      // Order items
      const { error: oiErr } = await supabase
        .from("order_items")
        .insert(items.map((i) => ({ ...i, order_id: order.id })));
      if (oiErr) throw oiErr;

      // Simulate payment + send notifications via server fn
      const result = await finalize({ data: { orderId: order.id } });
      if (!result.ok) throw new Error("Payment failed");

      await cart.clear();
      toast.success("Payment successful! Confirmation sent.");
      nav({ to: "/orders/$id", params: { id: order.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="glass rounded-3xl p-6 space-y-3">
          <h2 className="font-semibold">Shipping address</h2>
          {([
            ["name", "Full name"], ["address", "Address"], ["city", "City"], ["country", "Country"], ["phone", "Phone"],
          ] as const).map(([k, label]) => (
            <input key={k} required placeholder={label} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="glass w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          ))}
          <h2 className="mt-4 font-semibold">Payment method</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["card", "paypal", "stripe", "paystack"].map((m) => (
              <button type="button" key={m} onClick={() => setForm({ ...form, method: m })}
                className={`rounded-xl px-3 py-3 text-sm capitalize ${form.method === m ? "gradient-primary text-primary-foreground" : "glass glass-hover"}`}>
                {m}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Demo mode: payments are simulated. Configure live payment provider keys to enable real charges.</p>
        </div>
        <aside className="glass-strong h-fit rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {cart.items.map((i) => (
              <li key={i.id} className="flex justify-between"><span className="truncate">{i.product?.title} ×{i.quantity}</span><span>${(Number(i.product?.price ?? 0) * i.quantity).toFixed(2)}</span></li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-3 flex justify-between font-semibold">
            <span>Total</span><span className="gradient-text">${cart.subtotal.toFixed(2)}</span>
          </div>
          <button disabled={busy} className="mt-4 w-full rounded-full gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground glass-hover disabled:opacity-60">
            {busy ? "Processing..." : `Pay $${cart.subtotal.toFixed(2)}`}
          </button>
        </aside>
      </form>
    </AppShell>
  );
}
