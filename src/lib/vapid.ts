// Public VAPID key — safe in client bundle
export const VAPID_PUBLIC_KEY = "BG2K5y0WUcnnRKiGt2YEJ17WsxMaCf4NDc7n2cEBaA26gySZxbevtXFKEuNfoHILTZ-S6IBjv4svnhQH3K-9DZo";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
