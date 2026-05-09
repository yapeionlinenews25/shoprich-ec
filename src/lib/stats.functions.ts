import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPlatformStats = createServerFn({ method: "GET" }).handler(async () => {
  const [vendors, resellers, products, countries] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "vendor"),
    supabaseAdmin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "reseller"),
    supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("vendor_stores").select("country").not("country", "is", null),
  ]);
  const countrySet = new Set((countries.data ?? []).map((r: any) => (r.country || "").trim().toLowerCase()).filter(Boolean));
  return {
    vendors: vendors.count ?? 0,
    resellers: resellers.count ?? 0,
    products: products.count ?? 0,
    countries: countrySet.size,
  };
});
