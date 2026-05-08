import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Trash2, Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — ShopRich EC" }] }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const nav = useNavigate();

  if (!user)
    return (
      <AppShell>
        <div className="glass rounded-3xl p-10 text-center">
          <p className="text-muted-foreground">Please <Link to="/auth" className="text-accent underline">sign in</Link> to view your cart.</p>
        </div>
      </AppShell>
    );

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">Your cart</h1>
      {cart.items.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center">
          <p className="text-muted-foreground">Cart is empty. <Link to="/marketplace" className="text-accent underline">Browse products</Link>.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {cart.items.map((it) => (
              <div key={it.id} className="glass flex items-center gap-4 rounded-2xl p-4">
                <div className="h-16 w-16 rounded-xl gradient-primary" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{it.product?.title}</p>
                  <p className="text-xs text-muted-foreground">${Number(it.product?.price ?? 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => cart.update(it.id, it.quantity - 1)} className="glass glass-hover rounded-full p-1.5"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-6 text-center text-sm">{it.quantity}</span>
                  <button onClick={() => cart.update(it.id, it.quantity + 1)} className="glass glass-hover rounded-full p-1.5"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <button onClick={() => cart.remove(it.id)} className="glass glass-hover rounded-full p-2 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <aside className="glass-strong h-fit rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>Calculated at checkout</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold"><span>Total</span><span className="gradient-text">${cart.subtotal.toFixed(2)}</span></div>
            </div>
            <button onClick={() => nav({ to: "/checkout" })} className="mt-4 w-full rounded-full gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground glass-hover">
              Checkout
            </button>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
