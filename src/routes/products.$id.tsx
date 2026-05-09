import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { hueFromString } from "@/lib/utils-hue";
import { ShoppingCart, QrCode, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Reviews } from "@/components/app/Reviews";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const [p, setP] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const cart = useCart();
  const { roles, user } = useAuth();
  const url = typeof window !== "undefined" ? `${window.location.origin}/products/${id}?ref=${user?.id ?? ""}` : "";

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      setP(data);
      if (data?.store_id) {
        const { data: s } = await supabase.from("vendor_stores").select("*").eq("id", data.store_id).maybeSingle();
        setStore(s);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <AppShell><p className="text-center text-muted-foreground">Loading…</p></AppShell>;
  if (!p) return <AppShell><p className="text-center text-muted-foreground">Product not found.</p></AppShell>;

  const hue = hueFromString(p.id);

  return (
    <AppShell>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass overflow-hidden rounded-3xl">
          <div
            className="aspect-square w-full"
            style={{
              background: p.image_url
                ? `center/cover url(${p.image_url})`
                : `radial-gradient(at 30% 30%, oklch(0.7 0.22 ${hue}) 0, transparent 60%), radial-gradient(at 70% 70%, oklch(0.55 0.2 ${hue + 40}) 0, transparent 60%), oklch(0.25 0.05 280)`,
            }}
          />
        </div>
        <div className="space-y-4">
          {store && (
            <Link to="/marketplace" className="inline-block text-xs text-accent">
              {store.name} · {store.country ?? "Global"}
            </Link>
          )}
          <h1 className="text-3xl font-bold">{p.title}</h1>
          <p className="text-3xl font-bold gradient-text">${Number(p.price).toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{p.description ?? "No description provided."}</p>
          <p className="text-xs text-muted-foreground">In stock: {p.stock} · SKU: {p.sku ?? "—"}</p>

          <button
            disabled={p.stock <= 0}
            onClick={async () => {
              try {
                const ref = new URL(window.location.href).searchParams.get("ref");
                await cart.add(p.id, 1, ref || null);
                toast.success("Added to cart");
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground glass-hover disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" /> {p.stock > 0 ? "Add to cart" : "Out of stock"}
          </button>

          {roles.includes("reseller") && user && (
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold mb-2 inline-flex items-center gap-1.5"><QrCode className="h-3.5 w-3.5" /> Your reseller link ({p.reseller_commission_pct}% commission)</p>
              <div className="flex items-center gap-2 text-xs">
                <code className="flex-1 truncate glass rounded-lg px-2 py-1.5">{url}</code>
                <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }} className="glass glass-hover rounded-lg p-2"><Copy className="h-3.5 w-3.5" /></button>
              </div>
              <a target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-accent underline" href={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`}>View QR code</a>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
