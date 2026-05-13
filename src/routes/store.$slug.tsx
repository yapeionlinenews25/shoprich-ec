import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Store } from "lucide-react";

export const Route = createFileRoute("/store/$slug")({
  component: VendorStorefront,
});

function VendorStorefront() {
  const { slug } = Route.useParams() as { slug: string };
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    productCount: 0,
    rating: 4.8,
    salesData: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendor();
  }, [slug]);

  const loadVendor = async () => {
    try {
      // Find vendor by slug
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendor_applications")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .single();

      if (vendorError || !vendorData) throw new Error("Vendor not found");
      setVendor(vendorData);

      // Load vendor products
      const { data: prodData, error: prodError } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendorData.user_id)
        .eq("published", true);

      if (!prodError) setProducts(prodData ?? []);

      // Load analytics
      const { data: orderData } = await supabase
        .from("order_items")
        .select("line_total")
        .eq("vendor_id", vendorData.user_id);

      const totalSales = (orderData ?? []).reduce((sum, o) => sum + Number(o.line_total), 0);

      // Sample sales chart data
      setAnalytics({
        totalSales,
        productCount: (prodData ?? []).length,
        rating: 4.8,
        salesData: [\n          { date: "Mon", sales: 400 },\n          { date: "Tue", sales: 300 },\n          { date: "Wed", sales: 200 },\n          { date: "Thu", sales: 278 },\n          { date: "Fri", sales: 190 },\n          { date: "Sat", sales: 229 },\n          { date: "Sun", sales: 200 },\n        ],
      });
    } catch (error: any) {
      console.error("Error loading vendor:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AppShell><p>Loading...</p></AppShell>;
  if (!vendor) return <AppShell><p>Vendor not found.</p></AppShell>;

  return (
    <AppShell>
      {/* Vendor Header */}
      <div className="glass-strong rounded-3xl p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Store className="h-12 w-12" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{vendor.store_name}</h1>
            <p className="text-muted-foreground">{vendor.country}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold gradient-text">⭐ {analytics.rating}</p>
            <p className="text-sm text-muted-foreground">{analytics.productCount} products</p>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Total Sales</h2>
          <p className="text-4xl font-bold gradient-text">${analytics.totalSales.toFixed(2)}</p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.salesData}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#00d4ff" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Products */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {products.slice(0, 6).map((p) => (
            <div key={p.id} className="glass-strong rounded-2xl p-4 hover:shadow-lg transition">
              <div className="bg-gradient-to-br from-primary to-accent rounded-lg h-40 mb-4 flex items-center justify-center">
                <p className="text-xs text-white">Product image</p>
              </div>
              <h3 className="font-semibold truncate">{p.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">SKU: {p.sku}</p>
              <p className="text-lg font-bold gradient-text">${Number(p.price).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
