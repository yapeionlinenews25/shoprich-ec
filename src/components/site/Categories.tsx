import { Shirt, Smartphone, Home, Sparkles, Dumbbell, Gamepad2, Baby, Car } from "lucide-react";

const cats = [
  { name: "Fashion", icon: Shirt },
  { name: "Electronics", icon: Smartphone },
  { name: "Home", icon: Home },
  { name: "Beauty", icon: Sparkles },
  { name: "Fitness", icon: Dumbbell },
  { name: "Gaming", icon: Gamepad2 },
  { name: "Kids", icon: Baby },
  { name: "Auto", icon: Car },
];

export function Categories() {
  return (
    <section id="marketplace" className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Shop by category</h2>
          <p className="mt-1 text-sm text-muted-foreground">Discover trending picks from global vendors</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {cats.map((c) => (
          <button
            key={c.name}
            className="glass glass-hover flex flex-col items-center gap-2 rounded-2xl p-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <c.icon className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-sm font-medium">{c.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
