// Creates a Stripe Checkout Session for the current user's order.
// Activates automatically when STRIPE_SECRET_KEY is set.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Stripe not configured. Add STRIPE_SECRET_KEY." }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const { orderId, successUrl, cancelUrl } = await req.json();
    const { data: order } = await sb.from("orders").select("*").eq("id", orderId).eq("customer_id", u.user.id).maybeSingle();
    if (!order) return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });

    const { data: items } = await sb.from("order_items").select("*").eq("order_id", orderId);
    const lineItems = (items ?? []).map((i: any) => ({
      price_data: {
        currency: (order as any).currency?.toLowerCase() ?? "usd",
        product_data: { name: i.title },
        unit_amount: Math.round(Number(i.unit_price) * 100),
      },
      quantity: i.quantity,
    }));

    const body = new URLSearchParams();
    body.append("mode", "payment");
    body.append("success_url", successUrl);
    body.append("cancel_url", cancelUrl);
    body.append("client_reference_id", orderId);
    body.append("customer_email", u.user.email ?? "");
    lineItems.forEach((li, idx) => {
      body.append(`line_items[${idx}][price_data][currency]`, li.price_data.currency);
      body.append(`line_items[${idx}][price_data][product_data][name]`, li.price_data.product_data.name);
      body.append(`line_items[${idx}][price_data][unit_amount]`, String(li.price_data.unit_amount));
      body.append(`line_items[${idx}][quantity]`, String(li.quantity));
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const session = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: session.error?.message ?? "Stripe error" }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });

    await sb.from("orders").update({ payment_reference: session.id, payment_method: "stripe" }).eq("id", orderId);
    return new Response(JSON.stringify({ url: session.url, id: session.id }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
