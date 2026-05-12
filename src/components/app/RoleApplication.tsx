import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const CATEGORIES = ["Fashion", "Electronics", "Home", "Beauty", "Fitness", "Gaming", "Kids", "Auto", "Other"];
const VOLUMES = ["< $1k", "$1k–$10k", "$10k–$50k", "$50k–$250k", "> $250k"];

export function RoleApplication({ role }: { role: "vendor" | "reseller" }) {
  const { user } = useAuth();
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    business_name: "", country: "", category: "Fashion",
    description: "", website: "", expected_monthly_volume: VOLUMES[0],
  });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("vendor_applications").select("*")
      .eq("user_id", user.id).eq("requested_role", role)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    setExisting(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id, role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("vendor_applications").insert({
      user_id: user.id, requested_role: role, ...form, status: "pending",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted — we'll review and notify you.");
    load();
  };

  if (loading) return <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">Loading…</div>;

  if (existing && existing.status === "pending") {
    return (
      <div className="glass rounded-2xl p-4 text-sm flex items-center gap-3">
        <Clock className="h-5 w-5 text-amber-400" />
        <div>
          <div className="font-semibold">Application under review</div>
          <div className="text-xs text-muted-foreground">Submitted {new Date(existing.created_at).toLocaleDateString()} — admins will respond soon.</div>
        </div>
      </div>
    );
  }
  if (existing && existing.status === "rejected") {
    return (
      <div className="glass rounded-2xl p-4 text-sm">
        <div className="flex items-center gap-2 text-destructive font-semibold"><XCircle className="h-4 w-4" /> Not approved</div>
        {existing.review_notes && <p className="mt-1 text-xs text-muted-foreground">{existing.review_notes}</p>}
        <button onClick={() => setExisting(null)} className="glass glass-hover mt-3 rounded-full px-3 py-1.5 text-xs">Apply again</button>
      </div>
    );
  }
  if (existing && existing.status === "approved") {
    return (
      <div className="glass rounded-2xl p-4 text-sm flex items-center gap-2 text-emerald-400">
        <CheckCircle2 className="h-5 w-5" /> Approved — your {role} access is active.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-strong rounded-3xl p-6 space-y-3">
      <div>
        <h3 className="font-semibold">Apply to become a {role}</h3>
        <p className="text-xs text-muted-foreground">All applications are reviewed by our team.</p>
      </div>
      <input required maxLength={100} placeholder="Business / brand name"
        value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })}
        className="glass w-full rounded-xl px-4 py-2.5 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <input required maxLength={60} placeholder="Country"
          value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
          className="glass rounded-xl px-4 py-2.5 text-sm" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="glass rounded-xl px-4 py-2.5 text-sm">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <input maxLength={200} placeholder="Website or social link (optional)"
        value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
        className="glass w-full rounded-xl px-4 py-2.5 text-sm" />
      <select value={form.expected_monthly_volume} onChange={(e) => setForm({ ...form, expected_monthly_volume: e.target.value })}
        className="glass w-full rounded-xl px-4 py-2.5 text-sm">
        {VOLUMES.map((v) => <option key={v}>Expected monthly volume: {v}</option>)}
      </select>
      <textarea required maxLength={1000} rows={4}
        placeholder={`Tell us about your ${role === "vendor" ? "products and store" : "audience and promotion channels"}`}
        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="glass w-full rounded-xl px-4 py-2.5 text-sm" />
      <button disabled={busy} className="w-full rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glass-hover">
        {busy ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
