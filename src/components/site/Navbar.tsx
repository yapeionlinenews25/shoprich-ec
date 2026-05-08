import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, User } from "lucide-react";

export function Navbar() {
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
          <a href="#marketplace" className="hover:text-foreground transition-colors">Marketplace</a>
          <a href="#vendors" className="hover:text-foreground transition-colors">Vendors</a>
          <a href="#resellers" className="hover:text-foreground transition-colors">Resellers</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <button aria-label="Search" className="glass glass-hover rounded-full p-2">
            <Search className="h-4 w-4" />
          </button>
          <button className="glass glass-hover hidden rounded-full px-4 py-2 text-sm sm:inline-flex items-center gap-2">
            <User className="h-4 w-4" /> Sign in
          </button>
          <button className="rounded-full gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground glass-hover">
            Get started
          </button>
        </div>
      </div>
    </header>
  );
}
