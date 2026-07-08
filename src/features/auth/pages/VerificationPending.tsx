
import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Mail, RefreshCw, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@features/auth/hooks/useAuth";
import { resendVerificationEmail } from '@features/auth/services/auth';
import { supabase } from "@/lib/supabase";
import { APP_INFO } from "@/lib/appInfo";

export default function VerificationPending() {
  const navigate = useNavigate();
  const { user, profile, refreshSession, signOut, isLoading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [approved, setApproved] = useState(false);
  const approvedRef = useRef(false);
  const [userEmail] = useState(() => {
    return user?.email || localStorage.getItem('signup_email') || localStorage.getItem('ONBOARD_AFTER_SIGNUP_EMAIL') || '';
  });

  // When we detect approval (verified + not rejected/suspended), show success UI
  // then hand off to OnboardingGuard which routes the user to their home.
  useEffect(() => {
    if (isLoading || !user || approvedRef.current) return;
    const isApproved =
      profile?.verification_status === 'verified' &&
      profile?.verification_status !== undefined &&
      !(profile as { is_suspended?: boolean })?.is_suspended;
    if (isApproved) {
      approvedRef.current = true;
      setApproved(true);
      toast.success("Your account has been approved!");
      const t = window.setTimeout(() => navigate('/', { replace: true }), 1800);
      return () => window.clearTimeout(t);
    }
  }, [user, profile, isLoading, navigate]);

  // Live updates: subscribe to this user's profile row so approval is instant.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`profile-approval-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => {
          void refreshSession();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshSession]);

  // Background polling as a safety net if realtime is disabled on the table.
  useEffect(() => {
    if (!user?.id) return;
    const interval = window.setInterval(() => {
      if (approvedRef.current) return;
      void refreshSession();
    }, 6000);
    return () => window.clearInterval(interval);
  }, [user?.id, refreshSession]);

  const handleCheckStatus = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      await refreshSession();
      // The effect above will pick up the change and navigate; give it a tick.
      window.setTimeout(() => {
        if (!approvedRef.current) {
          toast.info("Your account is still pending verification");
        }
      }, 300);
    } catch (error) {
      logger.error("Error checking status:", error);
      toast.error("Failed to check verification status");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleResendEmail = async () => {
    if (!userEmail) {
      toast.error('Email address not found', {
        description: 'Please sign in again to resend verification email.'
      });
      return;
    }

    setIsResending(true);
    try {
      await resendVerificationEmail(userEmail);
      toast.success('Verification email sent!', {
        description: `Check your inbox at ${userEmail}`
      });
    } catch (error) {
      toast.error('Failed to resend email', {
        description: getErrorMessage(error) || 'Please try again later.'
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="light flex items-center justify-center min-h-[100dvh]" style={{ colorScheme: 'light', backgroundColor: '#e2e8f0' }}>
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div
      className="light min-h-[100dvh] flex flex-col items-center justify-center px-4"
      style={{
        colorScheme: 'light',
        backgroundColor: '#e2e8f0',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <img
            src="/nysc-logo-light.webp"
            alt="NYSC Logo"
            width={44}
            height={44}
            className="h-11 w-11 object-contain shrink-0"
          />
          <div>
            <p className="font-semibold text-[15px] text-slate-900 leading-none">{APP_INFO.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{APP_INFO.organization}</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Account Created</h1>
              <p className="text-sm text-slate-500 mt-1">
                Please verify your email to continue. An administrator will then review your account.
              </p>
            </div>
          </div>

          {userEmail && (
            <div className="rounded-md bg-slate-50 border border-slate-100 p-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700">Verification email sent</p>
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full h-10 rounded-md text-sm font-medium"
              variant="outline"
            >
              {isResending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</>
              ) : (
                <><Mail className="h-4 w-4 mr-2" />Resend Verification Email</>
              )}
            </Button>

            <Button
              onClick={handleCheckStatus}
              variant="outline"
              className="w-full h-10 rounded-md text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </Button>

            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full h-10 rounded-md text-sm text-slate-500 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Return to Login
            </Button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Need help?{' '}
          <a href={APP_INFO.support.emailHref} className="underline hover:text-slate-600 transition-colors">
            {APP_INFO.support.email}
          </a>
        </p>
      </div>
    </div>
  );
}
