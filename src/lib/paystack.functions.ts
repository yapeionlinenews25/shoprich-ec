import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAYSTACK_BASE = "https://api.paystack.co";

function authHeaders() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY not configured");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

// Public — list banks for a country (so users can pick before resolve)
export const listBanks = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      country: z.string().min(2).max(40).default("nigeria"),
      type: z.enum(["nuban", "mobile_money", "ghipss"]).optional(),
      currency: z.string().max(5).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams({ country: data.country });
    if (data.type) params.set("type", data.type);
    if (data.currency) params.set("currency", data.currency);
    const res = await fetch(`${PAYSTACK_BASE}/bank?${params}`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok || !json.status) return { ok: false, error: json.message || `paystack ${res.status}`, banks: [] };
    return {
      ok: true,
      banks: (json.data ?? []).map((b: any) => ({
        code: b.code,
        name: b.name,
        currency: b.currency,
        type: b.type,
        country: b.country,
      })),
    };
  });

// Verify + save the user's payout account
export const verifyAndSaveAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      country: z.string().min(2).max(40),
      type: z.enum(["bank", "mobile_money"]),
      bankCode: z.string().min(1).max(20),
      bankName: z.string().min(1).max(120),
      accountNumber: z.string().min(5).max(30).regex(/^[0-9]+$/),
      currency: z.string().min(3).max(5),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const params = new URLSearchParams({
      account_number: data.accountNumber,
      bank_code: data.bankCode,
    });
    const res = await fetch(`${PAYSTACK_BASE}/bank/resolve?${params}`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok || !json.status) {
      return { ok: false, error: json.message || `Could not verify (${res.status})` };
    }
    const accountName = json.data?.account_name as string;

    // Create transfer recipient (so payouts can be sent later)
    const recipientType = data.type === "mobile_money" ? "mobile_money" : "nuban";
    const recRes = await fetch(`${PAYSTACK_BASE}/transferrecipient`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        type: recipientType,
        name: accountName,
        account_number: data.accountNumber,
        bank_code: data.bankCode,
        currency: data.currency,
      }),
    });
    const recJson = await recRes.json();
    const recipientCode = recJson?.data?.recipient_code ?? null;

    const { supabase, userId } = context;
    // Make new account default; demote others
    await supabase.from("payout_accounts").update({ is_default: false }).eq("user_id", userId);
    const { error } = await supabase.from("payout_accounts").insert({
      user_id: userId,
      country: data.country,
      type: data.type,
      bank_code: data.bankCode,
      bank_name: data.bankName,
      account_number: data.accountNumber,
      account_name: accountName,
      currency: data.currency,
      verified: true,
      paystack_recipient_code: recipientCode,
      is_default: true,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, accountName, recipientCode };
  });

export const listMyPayoutAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("payout_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { accounts: data ?? [] };
  });

export const deletePayoutAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await supabase.from("payout_accounts").delete().eq("id", data.id);
    return { ok: true };
  });
