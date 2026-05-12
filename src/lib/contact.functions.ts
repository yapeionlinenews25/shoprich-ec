import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(4000),
});

async function sendGmail(to: string, subject: string, html: string) {
  const k = process.env.LOVABLE_API_KEY;
  const g = process.env.GOOGLE_MAIL_API_KEY;
  if (!k || !g) return { ok: false, error: "Gmail not configured" };
  const raw = [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/html; charset="UTF-8"', "", html].join("\r\n");
  const encoded = Buffer.from(raw, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${k}`, "X-Connection-Api-Key": g, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });
  if (!res.ok) return { ok: false, error: `Gmail ${res.status}: ${await res.text()}` };
  return { ok: true };
}

async function sendTelegram(chatId: string, text: string) {
  const k = process.env.LOVABLE_API_KEY;
  const t = process.env.TELEGRAM_API_KEY;
  if (!k || !t) return { ok: false, error: "Telegram not configured" };
  const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${k}`, "X-Connection-Api-Key": t, "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) return { ok: false, error: `Telegram ${res.status}: ${await res.text()}` };
  return { ok: true };
}

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d) => ContactSchema.parse(d))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient(url, key);
    const { data: cfg } = await sb.from("platform_settings").select("notification_email, notification_telegram_chat_id").eq("id", 1).maybeSingle();

    const subject = `Contact form: ${data.name}`;
    const html = `<h3>New contact message</h3><p><b>From:</b> ${data.name} &lt;${data.email}&gt;</p><p style="white-space:pre-wrap">${data.message.replace(/</g, "&lt;")}</p>`;
    const text = `New contact message\n\nFrom: ${data.name} <${data.email}>\n\n${data.message}`;

    const results: Record<string, any> = {};
    if (cfg?.notification_email) results.email = await sendGmail(cfg.notification_email, subject, html);
    if (cfg?.notification_telegram_chat_id) results.telegram = await sendTelegram(cfg.notification_telegram_chat_id, text);
    if (!cfg?.notification_email && !cfg?.notification_telegram_chat_id) {
      return { ok: false, error: "Admin has not configured notification channels yet." };
    }
    return { ok: true, results };
  });
