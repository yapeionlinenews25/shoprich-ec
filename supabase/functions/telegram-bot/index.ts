// supabase/functions/telegram-bot/index.ts
// Minimal Telegram webhook function for linking accounts and simple order actions.
// Expects env: TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE

import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

const TELEGRAM_API = (token: string) => `https://api.telegram.org/bot${token}`;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

async function supabaseRpc(path: string, body: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function handleStart(token: string, chatId: number) {
  // Find token in telegram_link_tokens table and link user
  const res = await fetch(`${SUPABASE_URL}/rest/v1/telegram_link_tokens?token=eq.${token}`, {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      Accept: "application/json",
    },
  });
  const rows = await res.json();
  if (!rows || rows.length === 0) return { ok: false, message: "Invalid token" };
  const row = rows[0];
  // Update profiles table with telegram_chat_id
  const update = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${row.user_id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ telegram_chat_id: chatId }),
  });
  // delete token
  await fetch(`${SUPABASE_URL}/rest/v1/telegram_link_tokens?token=eq.${token}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
    },
  });
  return { ok: true };
}

async function sendTelegramMessage(chatId: number | string, text: string, extra?: any) {
  await fetch(`${TELEGRAM_API(TELEGRAM_BOT_TOKEN)}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...extra }),
  });
}

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    // Telegram update structure
    const message = payload.message || payload.callback_query?.message;
    if (!message) return new Response(JSON.stringify({ ok: false }), { status: 200 });

    // Handle /start <token>
    if (payload.message && payload.message.text && payload.message.text.startsWith("/start")) {
      const parts = payload.message.text.split(" ");
      if (parts.length >= 2) {
        const token = parts[1].trim();
        const chatId = payload.message.chat.id;
        const res = await handleStart(token, chatId);
        if (res.ok) {
          await sendTelegramMessage(chatId, "✅ Account linked. You'll receive order notifications here.");
        } else {
          await sendTelegramMessage(chatId, "❌ Invalid or expired token.");
        }
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Handle callback_query actions (inline keyboard)
    if (payload.callback_query) {
      const data = payload.callback_query.data; // e.g. action:order:123:mark_shipped
      const fromId = payload.callback_query.from.id;
      // Very small router for actions
      const parts = data.split(":");
      if (parts[0] === "order") {
        const orderId = parts[1];
        const action = parts[2];
        if (action === "mark_shipped") {
          // Update order status via Supabase
          await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({ status: "shipped" }),
          });
          await sendTelegramMessage(fromId, `Order ${orderId} marked as shipped ✅`);
        }
        // ack callback
        await fetch(`${TELEGRAM_API(TELEGRAM_BOT_TOKEN)}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: payload.callback_query.id }),
        });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
