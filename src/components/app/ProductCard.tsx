import { Link } from "@tanstack/react-router";
import { Star, ShoppingCart } from "lucide-react";
import { hueFromString } from "@/lib/utils-hue";

export type ProductCardData = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category?: string | null;
  vendor_id: string;
};

export function ProductCard({ p, onAdd }: { p: ProductCardData; onAdd?: (id: string) => void }) {
  const hue = hueFromString(p.id);
  return (
    <article className="glass glass-hover overflow-hidden rounded-3xl">
      <Link to="/products/$id" params={{ id: p.id }} className="block">
        <div
          className="relative aspect-square w-full"
          style={{
            background: p.image_url
              ? `center/cover url(${p.image_url})`
              : `radial-gradient(at 30% 30%, oklch(0.7 0.22 ${hue}) 0, transparent 60%), radial-gradient(at 70% 70%, oklch(0.55 0.2 ${hue + 40}) 0, transparent 60%), oklch(0.25 0.05 280)`,
          }}
        />
      </Link>
      <div className="p-4">
        <Link to="/products/$id" params={{ id: p.id }} className="text-sm font-semibold hover:text-accent">
          {p.title}
        </Link>
        {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold gradient-text">${Number(p.price).toFixed(2)}</span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" /> 4.8
          </span>
        </div>
        {onAdd && (
          <button
            onClick={() => onAdd(p.id)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-primary px-3 py-2 text-sm font-medium text-primary-foreground glass-hover"
          >
            <ShoppingCart className="h-4 w-4" /> Add to cart
          </button>
        )}
      </div>
    </article>
  );
}
