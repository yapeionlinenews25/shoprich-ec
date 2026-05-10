import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-4 pb-10 pt-6">
      <div className="glass flex flex-col items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} ShopRich EC. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
