import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Categories } from "@/components/site/Categories";
import { FeaturedProducts } from "@/components/site/FeaturedProducts";
import { Roles } from "@/components/site/Roles";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopRich EC — Global Glassmorphism Marketplace" },
      {
        name: "description",
        content:
          "ShopRich EC is a worldwide multi-vendor marketplace for vendors, resellers, and buyers — beautiful glassmorphism UI, secure payments, and powerful analytics.",
      },
      { property: "og:title", content: "ShopRich EC — Global Marketplace" },
      {
        property: "og:description",
        content: "Sell, resell, and shop on a stunning glass-styled marketplace.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Categories />
        <FeaturedProducts />
        <Roles />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
