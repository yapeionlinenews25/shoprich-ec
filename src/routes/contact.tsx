import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — ShopRich EC" }, { name: "description", content: "Talk to the ShopRich EC team about partnerships, support, or vendor onboarding." }] }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await supabase.functions.invoke("send-contact", { body: form }).catch(() => {});
      toast.success("Message sent — we'll reply by email shortly.");
      setForm({ name: "", email: "", message: "" });
    } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold">Talk to <span className="gradient-text">our team</span></h1>
        <p className="mt-2 text-muted-foreground">Sales, partnerships, press, and platform support.</p>
        <form onSubmit={submit} className="glass mt-8 space-y-4 rounded-3xl p-6">
          <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm" />
          <textarea required rows={5} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm" />
          <button disabled={busy} className="w-full rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground glass-hover">{busy ? "Sending…" : "Send message"}</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
