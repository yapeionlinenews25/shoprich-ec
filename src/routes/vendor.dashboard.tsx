import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

export const Route = createFileRoute("/vendor/dashboard")({
  component: VendorDashboard,
});

function VendorDashboard() {
  const { user, roles } = useAuth();
  const nav = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
    sku: "",
    resale_allowed: false,
    reseller_commission_pct: 10,
    stock: 0,
  });

  if (!roles.includes("vendor")) {
    return <AppShell><p>Access denied. Vendors only.</p></AppShell>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(form)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase.from("products").insert({
          ...form,
          vendor_id: user?.id,
        });
        if (error) throw error;
        toast.success("Product created");
      }
      setEditingId(null);
      setForm({ title: "", description: "", price: 0, sku: "", resale_allowed: false, reseller_commission_pct: 10, stock: 0 });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Vendor Dashboard</h1>
        <form onSubmit={handleSave} className="glass-strong rounded-2xl p-6 space-y-3">
          <input
            placeholder="Product title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="glass w-full rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="glass w-full rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="glass w-full rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Stock"
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            className="glass w-full rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="glass w-full rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.resale_allowed}
              onChange={(e) => setForm({ ...form, resale_allowed: e.target.checked })}
              id="resale"
            />
            <label htmlFor="resale" className="text-sm">Allow resellers</label>
          </div>
          {form.resale_allowed && (
            <input
              placeholder="Reseller commission %"
              type="number"
              value={form.reseller_commission_pct}
              onChange={(e) => setForm({ ...form, reseller_commission_pct: Number(e.target.value) })}
              className="glass w-full rounded-lg px-3 py-2 text-sm"
            />
          )}
          <button
            type="submit"
            className="w-full rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {editingId ? "Update" : "Add"} Product
          </button>
        </form>
      </div>
    </AppShell>
  );
}
