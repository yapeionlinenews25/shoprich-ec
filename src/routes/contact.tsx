import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendContactMessage } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — ShopRich EC" }, { name: "description", content: "Talk to the ShopRich EC team about partnerships, support, or vendor onboarding." }] }),
  component: Contact,
});

function Contact() {
  const send = useServerFn(sendContactMessage);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await send({ data: form });
      if (!res.ok) toast.error(res.error || "Couldn't send right now — try again.");
      else {
        toast.success("Message sent — we'll reply by email shortly.");
        setForm({ name: "", email: "", message: "" });
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error — please try again.");
    } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold">Talk to <span className="gradient-text">our team</span></h1>
        <p className="mt-2 text-muted-foreground">Sales, partnerships, press, and platform support. Or <Link to="/auth" className="text-accent underline">sign in</Link> first for faster help.</p>
        <form onSubmit={submit} className="glass mt-8 space-y-4 rounded-3xl p-6">
          <input required maxLength={100} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm" />
          <input required type="email" maxLength={255} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm" />
          <textarea required rows={5} maxLength={4000} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm" />
          <button disabled={busy} className="w-full rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground glass-hover">{busy ? "Sending…" : "Send message"}</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
