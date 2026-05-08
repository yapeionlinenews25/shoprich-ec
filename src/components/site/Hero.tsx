import heroBg from "@/assets/hero-bg.jpg";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <img
        src={heroBg}
        alt=""
        width={1920}
        height={1280}
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            The global glassmorphism marketplace
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Sell. Resell. Shop.{" "}
            <span className="gradient-text">All in one place.</span>
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            ShopRich EC unites vendors, resellers, and customers worldwide on a
            beautiful, secure marketplace with enterprise-grade analytics,
            payments, and fulfillment.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button className="glass-hover inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              Start selling <ArrowRight className="h-4 w-4" />
            </button>
            <button className="glass glass-hover rounded-full px-6 py-3 text-sm font-semibold">
              Explore marketplace
            </button>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["12K+", "Vendors"],
            ["48K+", "Resellers"],
            ["1.2M+", "Products"],
            ["180+", "Countries"],
          ].map(([k, v]) => (
            <div key={v} className="glass glass-hover rounded-2xl px-4 py-5 text-center">
              <div className="text-2xl font-bold gradient-text">{k}</div>
              <div className="mt-1 text-xs text-muted-foreground">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
