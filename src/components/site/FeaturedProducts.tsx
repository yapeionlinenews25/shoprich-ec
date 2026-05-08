import { Star, Heart } from "lucide-react";

const products = [
  { name: "Aurora Wireless Headphones", price: 189, rating: 4.8, vendor: "SonicLabs", hue: 280 },
  { name: "Nimbus Smart Watch", price: 249, rating: 4.7, vendor: "TimeCo", hue: 220 },
  { name: "Lumen Desk Lamp", price: 79, rating: 4.9, vendor: "BrightHaus", hue: 320 },
  { name: "Zephyr Sneakers", price: 139, rating: 4.6, vendor: "RunFast", hue: 260 },
];

export function FeaturedProducts() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-bold sm:text-3xl">Featured products</h2>
        <a href="#" className="text-sm text-accent hover:underline">View all</a>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <article key={p.name} className="glass glass-hover overflow-hidden rounded-3xl">
            <div
              className="relative aspect-square w-full"
              style={{
                background: `radial-gradient(at 30% 30%, oklch(0.7 0.22 ${p.hue}) 0, transparent 60%), radial-gradient(at 70% 70%, oklch(0.55 0.2 ${p.hue + 40}) 0, transparent 60%), oklch(0.25 0.05 280)`,
              }}
            >
              <button
                aria-label="Save"
                className="absolute right-3 top-3 glass rounded-full p-2 glass-hover"
              >
                <Heart className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{p.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">by {p.vendor}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold gradient-text">${p.price}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {p.rating}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
