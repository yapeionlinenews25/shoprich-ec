import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ShopRich EC" }] }),
  component: AuthPage,
});

type Tab = "email" | "phone";

function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("email");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/account" }); }, [user, nav]);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/account`, data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to verify.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        nav({ to: "/account" });
      }
    } catch (err: any) { toast.error(err.message ?? "Authentication failed"); }
    finally { setBusy(false); }
  };

  const sendOtp = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setOtpSent(true);
      toast.success("OTP sent to your phone");
    } catch (err: any) { toast.error(err.message ?? "Could not send OTP"); }
    finally { setBusy(false); }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
      if (error) throw error;
      toast.success("Signed in");
      nav({ to: "/account" });
    } catch (err: any) { toast.error(err.message ?? "Invalid code"); }
    finally { setBusy(false); }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/account" });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  };

  const apple = async () => {
    const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin + "/account" });
    if (result.error) toast.error(result.error.message ?? "Apple sign-in failed");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary glow-ring">
            <ShoppingBag className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">ShopRich <span className="gradient-text">EC</span></span>
        </Link>
        <div className="glass-strong rounded-3xl p-8">
          <h1 className="text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Shop, sell, or resell — globally.</p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={google} className="glass glass-hover rounded-xl px-3 py-2.5 text-sm font-medium">Continue with Google</button>
            <button onClick={apple} className="glass glass-hover rounded-xl px-3 py-2.5 text-sm font-medium">Continue with Apple</button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <div className="mb-3 inline-flex rounded-full glass p-1 text-xs">
            <button onClick={() => setTab("email")} className={`rounded-full px-3 py-1.5 ${tab === "email" ? "gradient-primary text-primary-foreground" : ""}`}>Email</button>
            <button onClick={() => setTab("phone")} className={`rounded-full px-3 py-1.5 ${tab === "phone" ? "gradient-primary text-primary-foreground" : ""}`}>Phone</button>
          </div>

          {tab === "email" ? (
            <form onSubmit={submitEmail} className="space-y-3">
              {mode === "signup" && (
                <input type="text" placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)}
                  className="glass w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              )}
              <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="glass w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="glass w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button disabled={busy} className="w-full rounded-full gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground glass-hover disabled:opacity-60">
                {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? verifyOtp : (e) => { e.preventDefault(); sendOtp(); }} className="space-y-3">
              <input type="tel" required placeholder="+1 555 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="glass w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              {otpSent && (
                <input inputMode="numeric" required placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)}
                  className="glass w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              )}
              <button disabled={busy} className="w-full rounded-full gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground glass-hover disabled:opacity-60">
                {busy ? "Please wait..." : otpSent ? "Verify code" : "Send code"}
              </button>
              {otpSent && (
                <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="w-full text-center text-xs text-muted-foreground">Use a different phone</button>
              )}
            </form>
          )}

          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Phone sign-in requires SMS provider configuration in your backend. Apple sign-in works on supported devices.
        </p>
      </div>
    </div>
  );
}
