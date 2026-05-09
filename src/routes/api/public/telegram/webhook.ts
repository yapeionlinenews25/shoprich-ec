import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";

function deriveSecret(apiKey: string): string {
  return createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
  if (!_sb) _sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  return _sb;
}

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

async function tg(method: string, body: any) {
  const res = await fetch(`${GATEWAY}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": process.env.TELEGRAM_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error("tg error", method, res.status, await res.text());
}

const HELP = `<b>ShopRich EC Bot</b>

Commands:
/start [code] — link this Telegram to your ShopRich account
/orders — view your latest orders
/help — show this menu
/unlink — disconnect this Telegram from your account

Visit ShopRich EC to shop, sell, or resell worldwide.`;

async function handleCommand(chatId: number, text: string, tgUserId: number | null, username: string | null) {
  const [cmd, ...rest] = text.trim().split(/\s+/);
  const arg = rest.join(" ").trim();

  if (cmd === "/start") {
    if (arg) {
      const { data: tok } = await sb().from("telegram_link_tokens").select("*").eq("token", arg).is("used_at", null).maybeSingle();
      if (!tok) {
        await tg("sendMessage", { chat_id: chatId, text: "❌ This link code is invalid or already used. Generate a new one from your ShopRich EC account page." });
        return;
      }
      await sb().from("profiles").update({ telegram_chat_id: String(chatId) }).eq("user_id", (tok as any).user_id);
      await sb().from("telegram_link_tokens").update({ used_at: new Date().toISOString() }).eq("token", arg);
      await tg("sendMessage", { chat_id: chatId, text: `✅ <b>Linked!</b> You'll now receive ShopRich EC notifications here, ${username ? "@" + username : ""}.\n\n${HELP}`, parse_mode: "HTML" });
      return;
    }
    await tg("sendMessage", { chat_id: chatId, text: `👋 Welcome to <b>ShopRich EC</b>!\n\nTo connect this chat to your account, open ShopRich EC → Account → Connect Telegram, then follow the link.\n\n${HELP}`, parse_mode: "HTML" });
    return;
  }

  if (cmd === "/help") {
    await tg("sendMessage", { chat_id: chatId, text: HELP, parse_mode: "HTML" });
    return;
  }

  if (cmd === "/unlink") {
    await sb().from("profiles").update({ telegram_chat_id: null }).eq("telegram_chat_id", String(chatId));
    await tg("sendMessage", { chat_id: chatId, text: "🔌 Unlinked. You will no longer receive notifications here." });
    return;
  }

  if (cmd === "/orders") {
    const { data: profile } = await sb().from("profiles").select("user_id, display_name").eq("telegram_chat_id", String(chatId)).maybeSingle();
    if (!profile) {
      await tg("sendMessage", { chat_id: chatId, text: "You're not linked yet. Use /start <code> from your ShopRich EC account page." });
      return;
    }
    const { data: orders } = await sb().from("orders").select("order_number, total, currency, status, created_at").eq("customer_id", (profile as any).user_id).order("created_at", { ascending: false }).limit(5);
    if (!orders || orders.length === 0) {
      await tg("sendMessage", { chat_id: chatId, text: "📦 You have no orders yet." });
      return;
    }
    const lines = orders.map((o: any) => `• <b>${o.order_number}</b> — ${o.currency} ${Number(o.total).toFixed(2)} · ${o.status}`).join("\n");
    await tg("sendMessage", { chat_id: chatId, text: `🧾 <b>Recent orders</b>\n${lines}`, parse_mode: "HTML" });
    return;
  }

  await tg("sendMessage", { chat_id: chatId, text: "I didn't catch that. Try /help" });
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, info: "ShopRich EC telegram webhook" }),
      POST: async ({ request }) => {
        const apiKey = process.env.TELEGRAM_API_KEY;
        if (!apiKey) return new Response("not configured", { status: 500 });

        const expected = deriveSecret(apiKey);
        const got = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(got, expected)) return new Response("Unauthorized", { status: 401 });

        const update = await request.json();
        const message = update.message ?? update.edited_message;
        const updateId = update.update_id as number | undefined;
        if (!message?.chat?.id || typeof updateId !== "number") {
          return Response.json({ ok: true, ignored: true });
        }

        try {
          await sb().from("telegram_messages").upsert({
            update_id: updateId,
            chat_id: message.chat.id,
            tg_user_id: message.from?.id ?? null,
            username: message.from?.username ?? null,
            text: message.text ?? null,
            raw: update,
          }, { onConflict: "update_id" });
        } catch (e) {
          console.error("log insert failed", e);
        }

        if (typeof message.text === "string" && message.text.startsWith("/")) {
          await handleCommand(message.chat.id, message.text, message.from?.id ?? null, message.from?.username ?? null);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
