import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — ShopRich EC" }, { name: "description", content: "How ShopRich EC collects, uses, and protects your data across our global marketplace." }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 prose prose-invert">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {new Date().toLocaleDateString()}</p>
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p>ShopRich EC ("we") operates a global multi-vendor marketplace. We collect account info, order details, and device data to provide and improve the service.</p>
          <h2 className="text-foreground font-semibold">What we collect</h2>
          <p>Account profile, contact details, order history, payment metadata (handled by Stripe/Paystack), and optional Telegram chat ID for notifications.</p>
          <h2 className="text-foreground font-semibold">How we use it</h2>
          <p>Fulfillment, payouts, fraud prevention, customer support, and product improvement. We never sell personal data.</p>
          <h2 className="text-foreground font-semibold">Your rights</h2>
          <p>Request access, correction, or deletion at any time via the Contact page.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
