import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { ShoppingBag, ShoppingCart, LogOut, User, LayoutDashboard, Store, Users, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, roles, signOut } = useAuth();
  const cart = useCart();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase
      .channel("notif-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const dashLink = roles.includes("admin")
    ? { to: "/admin", label: "Admin", icon: ShieldCheck }
    : roles.includes("vendor")
    ? { to: "/vendor", label: "Vendor", icon: Store }
    : roles.includes("reseller")
    ? { to: "/reseller", label: "Reseller", icon: Users }
    : { to: "/account", label: "Account", icon: LayoutDashboard };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass-strong">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary glow-ring">
              <ShoppingBag className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              ShopRich <span className="gradient-text">EC</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <Link to="/marketplace" className={path.startsWith("/marketplace") ? "text-foreground" : "hover:text-foreground"}>Marketplace</Link>
            {user && <Link to="/notifications" className={path === "/notifications" ? "text-foreground" : "hover:text-foreground"}>Notifications {unread > 0 && <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">{unread}</span>}</Link>}
            {user && <Link to={dashLink.to} className="hover:text-foreground inline-flex items-center gap-1"><dashLink.icon className="h-4 w-4" /> {dashLink.label}</Link>}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/cart" className="glass glass-hover relative rounded-full p-2">
              <ShoppingCart className="h-4 w-4" />
              {cart.count > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-semibold text-secondary-foreground">
                  {cart.count}
                </span>
              )}
            </Link>
            {user ? (
              <button
                onClick={async () => {
                  await signOut();
                  nav({ to: "/" });
                }}
                className="glass glass-hover hidden rounded-full px-3 py-2 text-sm sm:inline-flex items-center gap-1.5"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <Link to="/auth" className="rounded-full gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground glass-hover inline-flex items-center gap-1.5">
                <User className="h-4 w-4" /> Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
