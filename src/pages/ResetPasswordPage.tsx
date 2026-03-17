import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/errorUtils";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const recoveryError = useMemo(() => {
    if (!ready) return "";
    return sessionReady ? "" : "Your reset link is invalid or expired. Please request a new password reset email.";
  }, [ready, sessionReady]);

  useEffect(() => {
    let mounted = true;

    const initializeRecovery = async () => {
      try {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const type = hash.get("type");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (type === "recovery" && accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          window.history.replaceState({}, document.title, "/reset-password");
          if (mounted) setSessionReady(true);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) setSessionReady(Boolean(data.session));
      } catch (error) {
        logger.error("[ResetPasswordPage] Recovery initialization failed:", error);
        if (mounted) setSessionReady(false);
      } finally {
        if (mounted) setReady(true);
      }
    };

    initializeRecovery();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password updated successfully.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      logger.error("[ResetPasswordPage] Failed to update password:", error);
      toast.error(getErrorMessage(error) || "Unable to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="light min-h-[100dvh] bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 sm:p-7 bg-card border border-border shadow-sm">
        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Reset password</h1>
          <p className="text-sm text-muted-foreground">Create a new password to get back into your account.</p>
        </div>

        {!ready ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating reset link...
          </div>
        ) : recoveryError ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{recoveryError}</AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>Use a password you have not used before and keep it private.</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Enter a new password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update password
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
