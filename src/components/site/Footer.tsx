export function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-4 pb-10 pt-6">
      <div className="glass flex flex-col items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} ShopRich EC. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}
