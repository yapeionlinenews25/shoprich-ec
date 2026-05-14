import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { ProductCard, type ProductCardData } from "@/components/app/ProductCard";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Search, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — ShopRich EC" }] }),
  component: Marketplace,
});

function Marketplace() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [minP, setMinP] = useState<string>("");
  const [maxP, setMaxP] = useState<string>("");
  const [sort, setSort] = useState<"new" | "price_asc" | "price_desc">("new");
  const [showFilters, setShowFilters] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("vendor_stores").select("country").not("country", "is", null).then(({ data }) => {
      const uniq = Array.from(new Set((data ?? []).map((r: any) => r.country).filter(Boolean))).sort();
      setCountries(uniq as string[]);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let storeIds: string[] | null = null;
      if (country) {
        const { data } = await supabase.from("vendor_stores").select("id").eq("country", country);
        storeIds = (data ?? []).map((s: any) => s.id);
        if (storeIds.length === 0) { setProducts([]); setLoading(false); return; }
      }
      let query = supabase
        .from("products")
        .select("id, title, price, currency, sku, image_url, category, vendor_id, status")
        .eq("status", "active")
        .limit(60);
      if (cat) query = query.eq("category", cat);
      if (q) query = query.ilike("title", `%${q}%`);
      if (minP) query = query.gte("price", Number(minP));
      if (maxP) query = query.lte("price", Number(maxP));
      if (storeIds) query = query.in("store_id", storeIds);
      if (sort === "new") query = query.order("created_at", { ascending: false });
      if (sort === "price_asc") query = query.order("price", { ascending: true });
      if (sort === "price_desc") query = query.order("price", { ascending: false });
      const { data } = await query;
      setProducts((data ?? []) as ProductCardData[]);
      setLoading(false);
    };
    load();
  }, [q, cat, country, minP, maxP, sort]);

  const cats = ["", "Fashion", "Electronics", "Home", "Beauty", "Fitness", "Gaming", "Kids", "Auto"];

  return (
    <AppShell>
      <div className="mb-6 glass rounded-2xl p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full glass px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..."
              className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <button onClick={() => setShowFilters((v) => !v)} className="glass glass-hover inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="glass rounded-full px-4 py-2 text-xs outline-none">
            <option value="new">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c || "all"} onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs ${cat === c ? "gradient-primary text-primary-foreground" : "glass glass-hover"}`}>
              {c || "All"}
            </button>
          ))}
        </div>
        {showFilters && (
          <div className="grid gap-2 sm:grid-cols-3">
            <input type="number" placeholder="Min price" value={minP} onChange={(e) => setMinP(e.target.value)}
              className="glass rounded-xl px-3 py-2 text-sm outline-none" />
            <input type="number" placeholder="Max price" value={maxP} onChange={(e) => setMaxP(e.target.value)}
              className="glass rounded-xl px-3 py-2 text-sm outline-none" />
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="glass rounded-xl px-3 py-2 text-sm outline-none">
              <option value="">All countries</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center">
          <p className="text-muted-foreground">No products match. Try adjusting filters or <Link to="/vendor" className="text-accent underline">open a store</Link>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p}
              onAdd={async (id) => {
                if (!user) {
                  sessionStorage.setItem("pending_cart_add", JSON.stringify({ productId: id, ref: null }));
                  toast.message("Please sign in", { description: "We'll add this to your cart after you sign in." });
                  navigate({ to: "/auth", search: { redirect: "/marketplace" } as any });
                  return;
                }
                try { await cart.add(id, 1); toast.success("Added to cart"); }
                catch (e: any) { toast.error(e.message); }
              }} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
