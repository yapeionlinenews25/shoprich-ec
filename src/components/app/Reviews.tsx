import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Star } from "lucide-react";

type Review = { id: string; user_id: string; rating: number; comment: string | null; created_at: string };

export function Reviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [list, setList] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
    const items = (data ?? []) as Review[];
    setList(items);
    if (items.length) {
      const ids = Array.from(new Set(items.map((r) => r.user_id)));
      const { data: ps } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
      const map: Record<string, string> = {};
      (ps ?? []).forEach((p: any) => (map[p.user_id] = p.display_name ?? "Customer"));
      setProfiles(map);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Sign in to leave a review");
    setBusy(true);
    try {
      const { error } = await supabase.from("reviews").upsert(
        { product_id: productId, user_id: user.id, rating, comment: comment.trim() || null },
        { onConflict: "product_id,user_id" }
      );
      if (error) throw error;
      toast.success("Review posted");
      setComment("");
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reviews</h2>
        <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
          <Star className="h-4 w-4 fill-current text-accent" /> {avg.toFixed(1)} · {list.length} review{list.length === 1 ? "" : "s"}
        </div>
      </div>

      {user && (
        <form onSubmit={submit} className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                <Star className={`h-5 w-5 ${n <= rating ? "fill-current text-accent" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." rows={3}
            className="glass w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <button disabled={busy} className="rounded-full gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground glass-hover disabled:opacity-60">
            {busy ? "Posting..." : "Post review"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>}
        {list.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{profiles[r.user_id] ?? "Customer"}</span>
              <span className="inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-current text-accent" : "text-muted-foreground"}`} />
                ))}
              </span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
            <p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
