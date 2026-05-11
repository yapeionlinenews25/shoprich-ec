import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const CheckoutSchema = z.object({
  orderId: z.string().uuid(),
});

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function gmail(to: string, subject: string, html: string) {
  const lk = process.env.LOVABLE_API_KEY;
  const gk = process.env.GOOGLE_MAIL_API_KEY;
  if (!lk || !gk || !to) return;
  const raw = [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/html; charset="UTF-8"', "", html].join("\r\n");
  const encoded = Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  await fetch("https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": gk, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  }).catch((e) => console.error("Gmail err", e));
}

async function tg(chatId: string | null | undefined, text: string) {
  const lk = process.env.LOVABLE_API_KEY;
  const tk = process.env.TELEGRAM_API_KEY;
  if (!lk || !tk || !chatId) return;
  await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": tk, "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch((e) => console.error("TG err", e));
}

async function pushTo(sb: ReturnType<typeof admin>, userId: string, title: string, body: string, url: string) {
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT;
  if (!priv || !subj) return;
  try {
    const webpush = (await import("web-push")).default;
    webpush.setVapidDetails(subj, "BG2K5y0WUcnnRKiGt2YEJ17WsxMaCf4NDc7n2cEBaA26gySZxbevtXFKEuNfoHILTZ-S6IBjv4svnhQH3K-9DZo", priv);
    const { data: subs } = await sb.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", userId);
    const payload = JSON.stringify({ title, body, url });
    await Promise.allSettled((subs ?? []).map(async (s: any) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    }));
  } catch (e) { console.error("push err", e); }
}

/**
 * Finalize an order: simulate payment success, mark as paid,
 * compute & insert commissions, send notifications via Gmail + Telegram
 * to the customer, vendors, resellers, and platform admin.
 */
export const finalizeOrderPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => CheckoutSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = admin();

    const { data: order, error: oErr } = await sb
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();
    if (oErr || !order) throw new Error("Order not found");
    if (order.status !== "pending") return { ok: true, alreadyProcessed: true };

    const { data: items } = await sb.from("order_items").select("*").eq("order_id", data.orderId);
    const { data: settings } = await sb.from("platform_settings").select("*").eq("id", 1).single();

    // Decrement stock + insert commissions
    for (const it of items ?? []) {
      await sb.rpc as unknown; // noop; we use direct update
      const { data: prod } = await sb.from("products").select("stock").eq("id", it.product_id).maybeSingle();
      if (prod) {
        await sb.from("products").update({ stock: Math.max(0, prod.stock - it.quantity) }).eq("id", it.product_id);
      }
      // commissions ledger
      await sb.from("commissions").insert({
        order_id: order.id,
        order_item_id: it.id,
        beneficiary_id: it.vendor_id,
        beneficiary_role: "vendor",
        amount: it.vendor_payout,
        currency: order.currency,
      });
      if (it.reseller_id && Number(it.reseller_commission) > 0) {
        await sb.from("commissions").insert({
          order_id: order.id,
          order_item_id: it.id,
          beneficiary_id: it.reseller_id,
          beneficiary_role: "reseller",
          amount: it.reseller_commission,
          currency: order.currency,
        });
      }
    }

    await sb
      .from("orders")
      .update({
        status: "paid",
        payment_method: order.payment_method ?? "card_simulated",
        payment_reference: "PAY-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
      })
      .eq("id", order.id);

    // -------- Notifications --------
    const totalStr = `${order.currency} ${Number(order.total).toFixed(2)}`;
    const customerSubject = `ShopRich EC — Order ${order.order_number} confirmed`;
    const customerHtml = `
      <h2>Thanks for your order!</h2>
      <p>Order <b>${order.order_number}</b> has been received and payment of <b>${totalStr}</b> was successful.</p>
      <p>We'll notify you when it ships.</p>`;

    // Customer profile
    const { data: customerProfile } = await sb
      .from("profiles")
      .select("contact_email, telegram_chat_id, display_name")
      .eq("user_id", order.customer_id)
      .maybeSingle();

    await Promise.all([
      gmail(customerProfile?.contact_email ?? "", customerSubject, customerHtml),
      tg(customerProfile?.telegram_chat_id, `✅ Order <b>${order.order_number}</b> confirmed — ${totalStr}`),
      pushTo(sb, order.customer_id, "Order confirmed", `${order.order_number} · ${totalStr}`, `/orders/${order.id}`),
      sb.from("notifications").insert({
        user_id: order.customer_id,
        title: "Order confirmed",
        body: `Order ${order.order_number} (${totalStr}) is paid and being prepared.`,
        link: `/orders/${order.id}`,
      }),
    ]);

    // Vendors + resellers per item
    const vendorIds = Array.from(new Set((items ?? []).map((i) => i.vendor_id)));
    const resellerIds = Array.from(new Set((items ?? []).map((i) => i.reseller_id).filter(Boolean) as string[]));

    for (const vid of vendorIds) {
      const vItems = (items ?? []).filter((i) => i.vendor_id === vid);
      const vTotal = vItems.reduce((s, i) => s + Number(i.vendor_payout), 0);
      const { data: vp } = await sb.from("profiles").select("contact_email, telegram_chat_id").eq("user_id", vid).maybeSingle();
      const html = `<h3>New paid order ${order.order_number}</h3>
        <p>You have <b>${vItems.length}</b> item(s) to fulfill. Estimated payout: <b>${order.currency} ${vTotal.toFixed(2)}</b>.</p>`;
      await Promise.all([
        gmail(vp?.contact_email ?? "", `New order ${order.order_number}`, html),
        tg(vp?.telegram_chat_id, `🛒 New paid order <b>${order.order_number}</b> — payout ${order.currency} ${vTotal.toFixed(2)}`),
        pushTo(sb, vid, "New paid order", `${order.order_number} · ${vItems.length} item(s)`, `/vendor`),
        sb.from("notifications").insert({
          user_id: vid,
          title: "New paid order",
          body: `Order ${order.order_number} — ${vItems.length} item(s)`,
          link: `/vendor/orders`,
        }),
      ]);
    }

    for (const rid of resellerIds) {
      const rItems = (items ?? []).filter((i) => i.reseller_id === rid);
      const rTotal = rItems.reduce((s, i) => s + Number(i.reseller_commission), 0);
      const { data: rp } = await sb.from("profiles").select("contact_email, telegram_chat_id").eq("user_id", rid).maybeSingle();
      await Promise.all([
        gmail(rp?.contact_email ?? "", `Commission earned — ${order.order_number}`, `<p>You earned <b>${order.currency} ${rTotal.toFixed(2)}</b> on order ${order.order_number}.</p>`),
        tg(rp?.telegram_chat_id, `💰 Commission ${order.currency} ${rTotal.toFixed(2)} on order ${order.order_number}`),
        pushTo(sb, rid, "Commission earned", `${order.currency} ${rTotal.toFixed(2)} on ${order.order_number}`, `/reseller`),
        sb.from("notifications").insert({
          user_id: rid,
          title: "Commission earned",
          body: `${order.currency} ${rTotal.toFixed(2)} on order ${order.order_number}`,
          link: `/reseller/earnings`,
        }),
      ]);
    }

    // Platform admin
    if (settings?.notification_email || settings?.notification_telegram_chat_id) {
      await Promise.all([
        gmail(settings.notification_email ?? "", `Platform: order ${order.order_number}`, `<p>Order total ${totalStr}, platform fee ${order.currency} ${Number(order.platform_fee).toFixed(2)}.</p>`),
        tg(settings.notification_telegram_chat_id, `📊 Order <b>${order.order_number}</b> — total ${totalStr}, fee ${order.currency} ${Number(order.platform_fee).toFixed(2)}`),
      ]);
    }

    return { ok: true };
  });
