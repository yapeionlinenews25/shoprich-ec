import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { roles } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "vendors" | "resellers" | "analytics">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ totalRevenue: 0, totalOrders: 0, activeVendors: 0 });

  useEffect(() => {
    if (!roles.includes("admin")) return;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (activeTab === "users") {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .limit(50);
        setUsers(data ?? []);
      } else if (activeTab === "vendors") {
        const { data } = await supabase
          .from("vendors")
          .select("*, profiles(*)")
          .limit(50);
        setVendors(data ?? []);
      } else if (activeTab === "analytics") {\n        const { data: ordersData } = await supabase\n          .from("orders")\n          .select("total");\n        const totalRevenue = (ordersData ?? []).reduce((sum, o) => sum + Number(o.total), 0);\n        setKpis({\n          totalRevenue,\n          totalOrders: ordersData?.length ?? 0,\n          activeVendors: vendors.length,\n        });\n      }\n    } catch (error: any) {\n      toast.error(error.message);\n    }\n  };\n\n  const approveVendor = async (vendorId: string) => {\n    try {\n      const { error } = await supabase\n        .from(\"vendors\")\n        .update({ status: \"approved\" })\n        .eq(\"id\", vendorId);\n      if (error) throw error;\n      toast.success(\"Vendor approved\");\n      loadData();\n    } catch (error: any) {\n      toast.error(error.message);\n    }\n  };\n\n  if (!roles.includes(\"admin\")) {\n    return <AppShell><p>Access denied. Admins only.</p></AppShell>;\n  }\n\n  return (\n    <AppShell>\n      <h1 className=\"text-2xl font-bold mb-6\">Admin Dashboard</h1>\n      \n      <div className=\"flex gap-2 mb-6\">\n        {[\"users\", \"vendors\", \"resellers\", \"analytics\"].map((tab) => (\n          <button\n            key={tab}\n            onClick={() => {\n              setActiveTab(tab as any);\n              loadData();\n            }}\n            className={`px-4 py-2 rounded-lg text-sm font-medium ${\n              activeTab === tab ? \"gradient-primary text-primary-foreground\" : \"glass\"\n            }`}\n          >\n            {tab.charAt(0).toUpperCase() + tab.slice(1)}\n          </button>\n        ))}\n      </div>\n\n      {activeTab === \"analytics\" && (\n        <div className=\"grid grid-cols-3 gap-4\">\n          <div className=\"glass-strong rounded-2xl p-6\">\n            <p className=\"text-muted-foreground text-sm\">Total Revenue</p>\n            <p className=\"text-2xl font-bold mt-2\">${kpis.totalRevenue.toFixed(2)}</p>\n          </div>\n          <div className=\"glass-strong rounded-2xl p-6\">\n            <p className=\"text-muted-foreground text-sm\">Total Orders</p>\n            <p className=\"text-2xl font-bold mt-2\">{kpis.totalOrders}</p>\n          </div>\n          <div className=\"glass-strong rounded-2xl p-6\">\n            <p className=\"text-muted-foreground text-sm\">Active Vendors</p>\n            <p className=\"text-2xl font-bold mt-2\">{kpis.activeVendors}</p>\n          </div>\n        </div>\n      )}\n\n      {activeTab === \"vendors\" && (\n        <div className=\"space-y-3\">\n          {vendors.map((v) => (\n            <div key={v.id} className=\"glass rounded-lg p-4 flex justify-between items-center\">\n              <div>\n                <p className=\"font-semibold\">{v.profiles?.display_name}</p>\n                <p className=\"text-xs text-muted-foreground\">{v.status}</p>\n              </div>\n              {v.status === \"pending\" && (\n                <button\n                  onClick={() => approveVendor(v.id)}\n                  className=\"px-3 py-1 rounded-lg bg-green-600 text-white text-sm\"\n                >\n                  Approve\n                </button>\n              )}\n            </div>\n          ))}\n        </div>\n      )}\n\n      {activeTab === \"users\" && (\n        <div className=\"space-y-2\">\n          {users.map((u) => (\n            <div key={u.id} className=\"glass rounded-lg p-3 text-sm\">\n              {u.display_name} ({u.country})\n            </div>\n          ))}\n        </div>\n      )}\n    </AppShell>\n  );\n}
