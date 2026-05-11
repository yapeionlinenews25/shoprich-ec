import { useEffect, useState } from "react";
import { Download, Bell } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { savePushSubscription } from "@/lib/push.functions";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/vapid";
import { useAuth } from "@/lib/auth";

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
  const { user } = useAuth();
  const saveSub = useServerFn(savePushSubscription);

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
    if (!("Notification" in window) || !("serviceWorker" in window.navigator)) {
      toast.error("Notifications not supported");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { toast.error("Notifications blocked"); return; }
    setPushOn(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      }
      const json: any = sub.toJSON();
      if (user) {
        await saveSub({
          data: {
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
            userAgent: navigator.userAgent.slice(0, 500),
          },
        });
        toast.success("Order alerts enabled on this device");
      } else {
        toast.message("Sign in to receive personalized order alerts");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Could not enable push: " + (e?.message ?? "unknown"));
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
