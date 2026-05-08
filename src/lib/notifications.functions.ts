import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const NotifySchema = z.object({
  email: z.string().email().optional().nullable(),
  telegramChatId: z.string().min(1).max(64).optional().nullable(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
});

async function sendGmail(to: string, subject: string, body: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_MAIL_API_KEY = process.env.GOOGLE_MAIL_API_KEY;
  if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) return { ok: false, error: "Gmail not configured" };

  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=\"UTF-8\"",
    "",
    body,
  ].join("\r\n");
  const encoded = Buffer.from(raw, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const res = await fetch("https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encoded }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Gmail send failed", res.status, t);
    return { ok: false, error: `Gmail ${res.status}` };
  }
  return { ok: true };
}

async function sendTelegram(chatId: string, text: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) return { ok: false, error: "Telegram not configured" };

  const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Telegram send failed", res.status, t);
    return { ok: false, error: `Telegram ${res.status}` };
  }
  return { ok: true };
}

export const sendNotification = createServerFn({ method: "POST" })
  .inputValidator((d) => NotifySchema.parse(d))
  .handler(async ({ data }) => {
    const emailRes = data.email ? await sendGmail(data.email, data.subject, `<p>${data.message.replace(/\n/g, "<br/>")}</p>`) : null;
    const tgRes = data.telegramChatId ? await sendTelegram(data.telegramChatId, `<b>${data.subject}</b>\n\n${data.message}`) : null;
    return { ok: true as const, email: emailRes, telegram: tgRes };
  });
