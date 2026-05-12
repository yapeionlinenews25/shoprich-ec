import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Package, DollarSign, ShoppingBag } from "lucide-react";
import { RoleApplication } from "@/components/app/RoleApplication";

export const Route = createFileRoute("/vendor")({
  component: VendorDashboard,
});

function VendorDashboard() {
  const { user, roles } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [storeForm, setStoreForm] = useState({ name: "", slug: "", description: "", country: "" });
  const [pf, setPf] = useState({ title: "", price: "", stock: "10", category: "Fashion", description: "", image_url: "", reseller_commission_pct: "10" });

  const load = async () => {
    if (!user) return;
    const { data: s } = await supabase.from("vendor_stores").select("*").eq("vendor_id", user.id).maybeSingle();
    setStore(s);
    if (s) {
      const { data: p } = await supabase.from("products").select("*").eq("store_id", s.id).order("created_at", { ascending: false });
      setProducts(p ?? []);
      const { data: oi } = await supabase.from("order_items").select("*, order:orders(order_number, status, created_at)").eq("vendor_id", user.id).order("created_at", { ascending: false }).limit(20);
      setOrders(oi ?? []);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  if (!user) return <AppShell><p>Please <Link to="/auth" className="text-accent underline">sign in</Link>.</p></AppShell>;
  if (!roles.includes("vendor")) return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-2">Become a vendor</h1>
      <p className="text-sm text-muted-foreground mb-6">Open a global ShopRich EC store. Applications are reviewed within 1–2 business days.</p>
      <div className="max-w-xl"><RoleApplication role="vendor" /></div>
    </AppShell>
  );

  const createStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("vendor_stores").insert({ ...storeForm, vendor_id: user.id, status: "active" });
    if (error) return toast.error(error.message);
    toast.success("Store created!");
    load();
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    const { error } = await supabase.from("products").insert({
      store_id: store.id, vendor_id: user.id,
      title: pf.title, price: Number(pf.price), stock: Number(pf.stock),
      category: pf.category, description: pf.description, image_url: pf.image_url || null,
      reseller_commission_pct: Number(pf.reseller_commission_pct),
    });
    if (error) return toast.error(error.message);
    toast.success("Product added");
    setPf({ ...pf, title: "", price: "", description: "", image_url: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    load();
  };

  const updateOrder = async (orderId: string, status: string) => {
    await supabase.from("orders").update({ status: status as any }).eq("id", orderId);
    toast.success(`Order ${status}`);
    load();
  };

  const revenue = orders.filter((o) => o.order?.status !== "pending").reduce((s, o) => s + Number(o.vendor_payout), 0);

  if (!store) {
    return (
      <AppShell>
        <h1 className="text-2xl font-bold mb-4">Open your store</h1>
        <form onSubmit={createStore} className="glass-strong max-w-lg space-y-3 rounded-3xl p-6">
          <input required placeholder="Store name" value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} className="glass w-full rounded-xl px-4 py-3 text-sm" />
          <input required placeholder="Slug (unique)" value={storeForm.slug} onChange={(e) => setStoreForm({ ...storeForm, slug: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm" />
          <input placeholder="Country" value={storeForm.country} onChange={(e) => setStoreForm({ ...storeForm, country: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm" />
          <textarea placeholder="Description" value={storeForm.description} onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm min-h-24" />
          <button className="rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glass-hover">Create store</button>
        </form>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Vendor · {store.name}</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Package} label="Products" value={products.length} />
        <Stat icon={ShoppingBag} label="Orders" value={orders.length} />
        <Stat icon={DollarSign} label="Earned" value={`$${revenue.toFixed(2)}`} />
        <Stat icon={DollarSign} label="Stock units" value={products.reduce((s, p) => s + p.stock, 0)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="glass-strong rounded-3xl p-6">
          <h2 className="font-semibold mb-3">Products</h2>
          <div className="space-y-2 max-h-96 overflow-auto">
            {products.map((p) => (
              <div key={p.id} className="glass flex items-center justify-between rounded-xl p-3 text-sm">
                <div><div className="font-semibold">{p.title}</div><div className="text-xs text-muted-foreground">${Number(p.price).toFixed(2)} · stock {p.stock}</div></div>
                <button onClick={() => remove(p.id)} className="glass glass-hover rounded-full p-2 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {products.length === 0 && <p className="text-xs text-muted-foreground">No products yet.</p>}
          </div>

          <h2 className="mt-6 font-semibold mb-3">Recent orders</h2>
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="glass flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-sm">
                <div><div className="font-semibold">{o.order?.order_number} · {o.title} ×{o.quantity}</div>
                  <div className="text-xs text-muted-foreground">Payout ${Number(o.vendor_payout).toFixed(2)} · {o.order?.status}</div></div>
                <div className="flex gap-1">
                  {["processing", "shipped", "delivered"].map((s) => (
                    <button key={s} onClick={() => updateOrder(o.order_id, s)} className="glass glass-hover rounded-lg px-2 py-1 text-[10px] capitalize">{s}</button>
                  ))}
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-xs text-muted-foreground">No orders yet.</p>}
          </div>
        </div>

        <form onSubmit={addProduct} className="glass-strong h-fit rounded-3xl p-6 space-y-2">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Add product</h2>
          <input required placeholder="Title" value={pf.title} onChange={(e) => setPf({ ...pf, title: e.target.value })} className="glass w-full rounded-xl px-4 py-2.5 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input required type="number" step="0.01" placeholder="Price" value={pf.price} onChange={(e) => setPf({ ...pf, price: e.target.value })} className="glass rounded-xl px-4 py-2.5 text-sm" />
            <input required type="number" placeholder="Stock" value={pf.stock} onChange={(e) => setPf({ ...pf, stock: e.target.value })} className="glass rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <select value={pf.category} onChange={(e) => setPf({ ...pf, category: e.target.value })} className="glass w-full rounded-xl px-4 py-2.5 text-sm">
            {["Fashion", "Electronics", "Home", "Beauty", "Fitness", "Gaming", "Kids", "Auto"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Image URL (optional)" value={pf.image_url} onChange={(e) => setPf({ ...pf, image_url: e.target.value })} className="glass w-full rounded-xl px-4 py-2.5 text-sm" />
          <input type="number" placeholder="Reseller commission %" value={pf.reseller_commission_pct} onChange={(e) => setPf({ ...pf, reseller_commission_pct: e.target.value })} className="glass w-full rounded-xl px-4 py-2.5 text-sm" />
          <textarea placeholder="Description" value={pf.description} onChange={(e) => setPf({ ...pf, description: e.target.value })} className="glass w-full rounded-xl px-4 py-2.5 text-sm min-h-20" />
          <button className="w-full rounded-full gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground glass-hover">Add product</button>
        </form>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="glass glass-hover rounded-2xl p-4">
      <Icon className="h-4 w-4 text-accent" />
      <div className="mt-2 text-xl font-bold gradient-text">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
