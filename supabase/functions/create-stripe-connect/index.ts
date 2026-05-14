// supabase/functions/create-stripe-connect/index.ts
// Create a Stripe Connect account and return an onboarding link (Standard Connect)
// Expects env: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE

import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE")!;

async function supabaseGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      Accept: "application/json",
    },
  });
  return res.json();
}

async function supabasePatch(path: string, body: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const { vendor_profile_id, email, country } = body;
    if (!vendor_profile_id) return new Response(JSON.stringify({ error: "vendor_profile_id required" }), { status: 400 });

    // Create Stripe account (Standard)
    const form = new URLSearchParams();
    form.append("type", "standard");
    if (country) form.append("country", country);
    if (email) form.append("email", email);

    const createAcc = await fetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const accData = await createAcc.json();
    if (accData.error) return new Response(JSON.stringify({ error: accData.error }), { status: 400 });

    // Create account link for onboarding
    const linkForm = new URLSearchParams();
    linkForm.append("account", accData.id);
    linkForm.append("refresh_url", body.refreshUrl || `${body.origin || ""}/vendor/onboard/refresh`);
    linkForm.append("return_url", body.returnUrl || `${body.origin || ""}/vendor/onboard/complete`);
    linkForm.append("type", "account_onboarding");

    const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
      method: "POST",
      headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: linkForm.toString(),
    });
    const linkData = await linkRes.json();
    if (linkData.error) return new Response(JSON.stringify({ error: linkData.error }), { status: 400 });

    // Persist stripe_account_id to vendor_profiles
    await supabasePatch(`vendor_profiles?id=eq.${vendor_profile_id}`, { stripe_account_id: accData.id });

    return new Response(JSON.stringify({ url: linkData.url, account: accData.id }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
