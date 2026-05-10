import { Star, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type P = { id: string; title: string; price: number; image_url: string | null; vendor_stores?: { name: string } | null };

export function FeaturedProducts() {
  const [products, setProducts] = useState<P[]>([]);
  useEffect(() => {
    supabase
      .from("products")
      .select("id,title,price,image_url,vendor_stores(name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setProducts((data as any) ?? []));
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-bold sm:text-3xl">Featured products</h2>
        <Link to="/marketplace" className="text-sm text-accent hover:underline">View all</Link>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground">No products yet — be the first vendor to list one.</p>
        )}
        {products.map((p, i) => {
          const hue = 220 + (i * 40) % 160;
          return (
            <Link key={p.id} to="/products/$id" params={{ id: p.id }} className="glass glass-hover overflow-hidden rounded-3xl">
              <div
                className="relative aspect-square w-full"
                style={{
                  backgroundImage: p.image_url ? `url(${p.image_url})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  background: p.image_url
                    ? undefined
                    : `radial-gradient(at 30% 30%, oklch(0.7 0.22 ${hue}) 0, transparent 60%), radial-gradient(at 70% 70%, oklch(0.55 0.2 ${hue + 40}) 0, transparent 60%), oklch(0.25 0.05 280)`,
                }}
              >
                <span aria-label="Save" className="absolute right-3 top-3 glass rounded-full p-2">
                  <Heart className="h-4 w-4" />
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold line-clamp-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground">by {p.vendor_stores?.name ?? "Vendor"}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold gradient-text">${Number(p.price).toFixed(2)}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" /> New
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
