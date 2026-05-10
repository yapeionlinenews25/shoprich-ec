import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — ShopRich EC" }, { name: "description", content: "Terms governing use of the ShopRich EC marketplace by buyers, vendors, and resellers." }] }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {new Date().toLocaleDateString()}</p>
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p>By using ShopRich EC you agree to these terms. Vendors are responsible for the accuracy of listings and fulfillment of orders. Resellers earn commissions on attributed sales per the published commission schedule.</p>
          <p>Platform commissions are deducted automatically at order capture. Refunds and disputes follow our published policy and applicable consumer law.</p>
          <p>We may suspend accounts that violate these terms, applicable law, or our acceptable-use policy.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
