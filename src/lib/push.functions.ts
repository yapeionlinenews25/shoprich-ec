import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SubSchema = z.object({
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(10).max(500),
  auth: z.string().min(10).max(500),
  userAgent: z.string().max(500).optional().nullable(),
});

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SubSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_agent: data.userAgent ?? null,
        },
        { onConflict: "endpoint" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ endpoint: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await supabase.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
    return { ok: true };
  });

export const sendPushToUser = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      userId: z.string().uuid(),
      title: z.string().min(1).max(120),
      body: z.string().min(1).max(500),
      url: z.string().max(500).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
    const VAPID_SUBJECT = process.env.VAPID_SUBJECT;
    if (!VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      console.error("VAPID keys not configured");
      return { ok: false, error: "vapid_missing" };
    }

    const webpush = (await import("web-push")).default;
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      "BG2K5y0WUcnnRKiGt2YEJ17WsxMaCf4NDc7n2cEBaA26gySZxbevtXFKEuNfoHILTZ-S6IBjv4svnhQH3K-9DZo",
      VAPID_PRIVATE_KEY,
    );

    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", data.userId);
    if (error) {
      console.error("push subs query failed", error);
      return { ok: false, error: error.message };
    }

    const payload = JSON.stringify({ title: data.title, body: data.body, url: data.url ?? "/" });
    const results = await Promise.allSettled(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
          throw e;
        }
      }),
    );
    const sent = results.filter((r) => r.status === "fulfilled").length;
    return { ok: true, sent, total: subs?.length ?? 0 };
  });
