import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Command, Eye, EyeOff, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInIntern, signOutIntern, signUpIntern } from "@/lib/auth";
import { fetchMyProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type SignInTab = "intern" | "admin";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Intern Login — LeadNest Intern CRM" },
      {
        name: "description",
        content: "Sign in with your intern account to see the leads, follow-ups and notes assigned to you.",
      },
      { property: "og:title", content: "Intern Login — LeadNest Intern CRM" },
      {
        property: "og:description",
        content: "Secure intern sign-in for the LeadNest Intern CRM workspace.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [tab, setTab] = useState<SignInTab>("intern");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signUpIntern(email.trim(), password, name.trim());
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setBusy(false);
          setError(null);
          toast.success("Account created — check your email to confirm it, then sign in.");
          setMode("signin");
          return;
        }
        toast.success("Account created");
        navigate({ to: "/", replace: true });
        return;
      }

      await signInIntern(email.trim(), password);

      // The profile's stored role is the source of truth — the selected tab
      // only decides which entrance is appropriate, never the permissions.
      const profile = await fetchMyProfile();
      const role = profile?.role ?? "intern";
      const isStaff = role === "admin" || role === "owner";

      if (tab === "intern" && isStaff) {
        await signOutIntern();
        const message = "Please use Admin Sign In for this account.";
        setError(message);
        toast.error(message);
        return;
      }
      if (tab === "admin" && !isStaff) {
        await signOutIntern();
        const message = "Please use Intern Sign In for this account.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Signed in");
      navigate({ to: isStaff ? "/admin" : "/", replace: true });
    } catch (err) {
      const raw = (err as Error).message;
      const message = /invalid login credentials/i.test(raw)
        ? "That email and password don't match an account. Please try again."
        : /already registered/i.test(raw)
          ? "An account with this email already exists. Try signing in instead."
          : raw;
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,color-mix(in_oklab,var(--primary)_15%,transparent),transparent_30rem)]" />
      <Card className="crm-page-enter relative w-full max-w-[410px] overflow-hidden border-border/80 bg-card/90 shadow-[var(--shadow-float)]">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        <CardHeader className="items-center pb-5 pt-8 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-[var(--shadow-action)]">
            <Command className="size-6" />
          </div>
          <p className="crm-kicker">Secure workspace</p>
          <CardTitle className="text-xl">
            {mode === "signin"
              ? tab === "admin"
                ? "Admin sign in"
                : "Intern sign in"
              : "Create intern account"}
          </CardTitle>
          <p className="max-w-xs text-sm text-muted-foreground">
            {mode === "signin" && tab === "admin"
              ? "LeadNest Intern CRM — for admin and owner accounts."
              : "LeadNest Intern CRM — you only ever see the work assigned to your own Intern ID."}
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          {mode === "signin" && (
            <div
              role="tablist"
              aria-label="Sign in options"
              className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-background/50 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "intern"}
                onClick={() => {
                  setTab("intern");
                  setError(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 font-mono text-[0.7rem] font-medium uppercase transition-all",
                  tab === "intern"
                    ? "bg-accent text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <UserRound className="size-4" />
                Intern Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "admin"}
                onClick={() => {
                  setTab("admin");
                  setError(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 font-mono text-[0.7rem] font-medium uppercase transition-all",
                  tab === "admin"
                    ? "bg-accent text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ShieldCheck className="size-4" />
                Admin Sign In
              </button>
            </div>
          )}
          <form className="space-y-4" onSubmit={submit}>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "signin" ? "Signing in..." : "Creating account..."}
                </span>
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-sm text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => {
              setError(null);
              setMode(mode === "signin" ? "signup" : "signin");
            }}
          >
            {mode === "signin"
              ? "New intern? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
