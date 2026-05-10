import { useEffect, useState } from "react";
import { Download, Bell } from "lucide-react";
import { toast } from "sonner";

function isPreviewOrIframe() {
  try {
    if (window.self !== window.top) return true;
  } catch { return true; }
  const h = window.location.hostname;
  return h.includes("id-preview--") || h.includes("lovableproject.com");
}

export function PwaInstall() {
  const [deferred, setDeferred] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [pushOn, setPushOn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPreviewOrIframe()) {
      navigator.serviceWorker?.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      return;
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia?.("(display-mode: standalone)").matches) setInstalled(true);
    if ("Notification" in window) setPushOn(Notification.permission === "granted");
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) { toast.message("Use your browser menu → Install app"); return; }
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") toast.success("ShopRich EC installed");
    setDeferred(null);
  };

  const enablePush = async () => {
    if (!("Notification" in window)) { toast.error("Notifications not supported"); return; }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setPushOn(true);
      toast.success("Order updates enabled");
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification("Notifications enabled", { body: "You'll get order updates here.", icon: "/icon-192.png" });
      } catch {}
    } else {
      toast.error("Notifications blocked");
    }
  };

  if (installed && pushOn) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
      {!installed && (
        <button onClick={install} className="glass glass-hover inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg">
          <Download className="h-4 w-4" /> Install app
        </button>
      )}
      {!pushOn && (
        <button onClick={enablePush} className="glass glass-hover inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg">
          <Bell className="h-4 w-4" /> Enable order alerts
        </button>
      )}
    </div>
  );
}
