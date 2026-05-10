import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20">
      <div className="glass-strong relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-full opacity-50 mesh-bg blur-3xl" />
        <h2 className="text-3xl font-bold sm:text-4xl">
          Ready to launch with <span className="gradient-text">ShopRich EC</span>?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Open your store in minutes. Free to start, scale globally, only pay when you sell.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/vendor" className="glass-hover inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            Create your store <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/contact" className="glass glass-hover rounded-full px-6 py-3 text-sm font-semibold">
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  );
}
