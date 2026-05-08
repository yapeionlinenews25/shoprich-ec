import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { ProductCard, type ProductCardData } from "@/components/app/ProductCard";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { Search } from "lucide-react";

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — ShopRich EC" }] }),
  component: Marketplace,
});

function Marketplace() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const cart = useCart();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("id, title, price, image_url, category, vendor_id, status")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60);
      if (cat) query = query.eq("category", cat);
      if (q) query = query.ilike("title", `%${q}%`);
      const { data } = await query;
      setProducts((data ?? []) as ProductCardData[]);
      setLoading(false);
    };
    load();
  }, [q, cat]);

  const cats = ["", "Fashion", "Electronics", "Home", "Beauty", "Fitness", "Gaming", "Kids", "Auto"];

  return (
    <AppShell>
      <div className="mb-6 glass rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-full glass px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c || "all"} onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs ${cat === c ? "gradient-primary text-primary-foreground" : "glass glass-hover"}`}>
              {c || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center">
          <p className="text-muted-foreground">No products yet. Be the first vendor — <Link to="/vendor" className="text-accent underline">open a store</Link>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              onAdd={async (id) => {
                try {
                  await cart.add(id, 1);
                  toast.success("Added to cart");
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
