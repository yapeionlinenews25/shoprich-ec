import { Store, Users, ShoppingCart, ShieldCheck, ArrowRight } from "lucide-react";

const roles = [
  {
    id: "vendors",
    icon: Store,
    title: "For Vendors",
    desc: "Launch your store globally. Manage inventory, fulfill orders, and track revenue in real-time.",
    points: ["Sales analytics", "Bulk product upload", "Payouts & commissions"],
  },
  {
    id: "resellers",
    icon: Users,
    title: "For Resellers",
    desc: "Curate products, share referral links and QR codes, and earn multi-tier commissions.",
    points: ["Add to my store", "QR & referral links", "Real-time payouts"],
  },
  {
    id: "buyers",
    icon: ShoppingCart,
    title: "For Buyers",
    desc: "Shop millions of products with fast checkout, secure payments, and live order tracking.",
    points: ["Wishlist & compare", "Multi-gateway payments", "Live tracking"],
  },
  {
    id: "admin",
    icon: ShieldCheck,
    title: "For Admins",
    desc: "Oversee the entire marketplace with moderation tools, analytics, and platform controls.",
    points: ["User management", "Disputes & refunds", "Revenue insights"],
  },
];

export function Roles() {
  return (
    <section id="vendors" className="mx-auto max-w-7xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          One platform, <span className="gradient-text">four superpowers</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Tailored experiences for every stakeholder in the commerce journey.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((r) => (
          <article
            key={r.id}
            id={r.id}
            className="glass glass-hover group relative overflow-hidden rounded-3xl p-6"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary glow-ring">
              <r.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{r.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {r.points.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100">
              Learn more <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
