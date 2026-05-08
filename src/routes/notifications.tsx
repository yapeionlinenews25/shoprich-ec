import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    setItems(data ?? []);
  };

  useEffect(() => { load(); }, [user?.id]);

  if (!user) return <AppShell><p className="text-center text-muted-foreground">Please <Link to="/auth" className="text-accent underline">sign in</Link>.</p></AppShell>;

  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    toast.success("All marked as read");
    load();
  };

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold inline-flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</h1>
        <button onClick={markAll} className="glass glass-hover rounded-full px-4 py-2 text-xs">Mark all read</button>
      </div>
      {items.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center"><p className="text-muted-foreground">No notifications yet.</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className={`glass rounded-2xl p-4 ${!n.read ? "ring-1 ring-accent/40" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                  {n.link && <Link to={n.link} className="mt-1 inline-block text-xs text-accent underline">Open</Link>}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(n.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
