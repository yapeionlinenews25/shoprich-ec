// Creates a Paystack transaction. Activates when PAYSTACK_SECRET_KEY is set.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Paystack not configured. Add PAYSTACK_SECRET_KEY." }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const { orderId, callbackUrl } = await req.json();
    const { data: order } = await sb.from("orders").select("*").eq("id", orderId).eq("customer_id", u.user.id).maybeSingle();
    if (!order) return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: u.user.email,
        amount: Math.round(Number((order as any).total) * 100),
        currency: ((order as any).currency ?? "USD").toUpperCase(),
        reference: (order as any).order_number,
        callback_url: callbackUrl,
        metadata: { order_id: orderId },
      }),
    });
    const data = await res.json();
    if (!data.status) return new Response(JSON.stringify({ error: data.message ?? "Paystack error" }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });

    await sb.from("orders").update({ payment_reference: data.data.reference, payment_method: "paystack" }).eq("id", orderId);
    return new Response(JSON.stringify({ url: data.data.authorization_url, reference: data.data.reference }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
