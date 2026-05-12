import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Search, User, LogOut, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };
  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary glow-ring">
            <ShoppingBag className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            ShopRich <span className="gradient-text">EC</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
          <Link to="/vendor" className="hover:text-foreground transition-colors">Vendors</Link>
          <Link to="/reseller" className="hover:text-foreground transition-colors">Resellers</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/marketplace" aria-label="Search" className="glass glass-hover rounded-full p-2">
            <Search className="h-4 w-4" />
          </Link>
          {user ? (
            <>
              <Link to="/settings/notifications" aria-label="Notification settings" title="Notifications" className="glass glass-hover hidden rounded-full p-2 sm:inline-flex">
                <Bell className="h-4 w-4" />
              </Link>
              <Link to="/account" className="glass glass-hover hidden rounded-full px-4 py-2 text-sm sm:inline-flex items-center gap-2">
                <User className="h-4 w-4" /> Account
              </Link>
              <button onClick={handleSignOut} aria-label="Sign out" className="glass glass-hover rounded-full p-2" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="glass glass-hover hidden rounded-full px-4 py-2 text-sm sm:inline-flex items-center gap-2">
                <User className="h-4 w-4" /> Sign in
              </Link>
              <Link to="/auth" className="rounded-full gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground glass-hover">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
