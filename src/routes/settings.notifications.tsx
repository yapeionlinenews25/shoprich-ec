import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Megaphone } from "lucide-react";

export const Route = createFileRoute("/settings/notifications")({
  head: () => ({ meta: [{ title: "Notification settings — ShopRich EC" }] }),
  component: NotificationSettings,
});

function NotificationSettings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [pushPerm, setPushPerm] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) setPushPerm(Notification.permission);
    else setPushPerm("unsupported");
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setPrefs(data);
      else {
        const { data: created } = await supabase.from("notification_preferences").insert({ user_id: user.id }).select().single();
        setPrefs(created);
      }
    })();
  }, [user?.id]);

  if (!user) return <AppShell><p>Please <Link to="/auth" className="text-accent underline">sign in</Link>.</p></AppShell>;
  if (!prefs) return <AppShell><p className="text-muted-foreground text-sm">Loading…</p></AppShell>;

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("notification_preferences").update({
      push_orders: prefs.push_orders, email_orders: prefs.email_orders,
      sms_orders: prefs.sms_orders, marketing_emails: prefs.marketing_emails,
      phone: prefs.phone || null,
    }).eq("user_id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Preferences saved");
  };

  const requestPush = async () => {
    if (!("Notification" in window)) return toast.error("Push not supported on this device");
    const p = await Notification.requestPermission();
    setPushPerm(p);
    if (p === "granted") toast.success("Push notifications enabled");
    else toast.error("Push permission denied — enable it in your browser settings");
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Notification settings</h1>
      <p className="text-sm text-muted-foreground">Choose how you want to hear from ShopRich EC.</p>

      <div className="glass-strong mt-6 max-w-xl space-y-1 rounded-3xl p-6">
        <Toggle icon={Bell} label="Push notifications" sub="Order updates, payments, shipping"
          checked={prefs.push_orders} onChange={(v) => setPrefs({ ...prefs, push_orders: v })}>
          {pushPerm !== "granted" && pushPerm !== "unsupported" && (
            <button onClick={requestPush} className="glass glass-hover rounded-full px-3 py-1 text-[11px]">Enable browser permission</button>
          )}
          {pushPerm === "unsupported" && <span className="text-[11px] text-muted-foreground">Not supported here</span>}
          {pushPerm === "granted" && <span className="text-[11px] text-emerald-400">Browser permission ✓</span>}
        </Toggle>
        <Toggle icon={Mail} label="Email order alerts" sub="Confirmations, receipts, status changes"
          checked={prefs.email_orders} onChange={(v) => setPrefs({ ...prefs, email_orders: v })} />
        <Toggle icon={MessageSquare} label="SMS order alerts" sub="Texts when status changes"
          checked={prefs.sms_orders} onChange={(v) => setPrefs({ ...prefs, sms_orders: v })} />
        {prefs.sms_orders && (
          <input placeholder="Phone (e.g. +234…)" value={prefs.phone ?? ""}
            onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })}
            className="glass mt-2 w-full rounded-xl px-4 py-2.5 text-sm" />
        )}
        <Toggle icon={Megaphone} label="Marketing emails" sub="Drops, promos, vendor highlights"
          checked={prefs.marketing_emails} onChange={(v) => setPrefs({ ...prefs, marketing_emails: v })} />

        <button onClick={save} disabled={busy}
          className="mt-4 w-full rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glass-hover">
          {busy ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </AppShell>
  );
}

function Toggle({ icon: Icon, label, sub, checked, onChange, children }: any) {
  return (
    <div className="glass flex items-start justify-between gap-3 rounded-2xl p-4">
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 text-accent shrink-0" />
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
          {children && <div className="mt-1.5">{children}</div>}
        </div>
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "gradient-primary" : "bg-muted/40"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}
