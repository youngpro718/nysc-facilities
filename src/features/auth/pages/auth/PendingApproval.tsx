// Pending Approval — shown to users awaiting admin approval
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { POLLING } from '@/config';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';
import { APP_INFO } from '@/lib/appInfo';

/**
 * PendingApproval - Shown to users waiting for admin approval
 * 
 * After signup and email verification, users must wait for admin approval
 * before they can access the system.
 */
export default function PendingApproval() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  // Check if user has been approved
  const checkApprovalStatus = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('verification_status, is_approved')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data?.verification_status === 'verified' && data?.is_approved) {
        navigate('/', { replace: true });
      } else if (data?.verification_status === 'rejected') {
        navigate('/auth/account-rejected', { replace: true });
      }
    } catch (error) {
      logger.error('Error checking approval status:', error);
    } finally {
      setChecking(false);
    }
  };

  // Check status on mount and periodically
  useEffect(() => {
    let mounted = true;

    const check = async () => {
      if (!mounted) return;
      await checkApprovalStatus();
    };

    check();
    
    const interval = setInterval(check, POLLING.approvalCheck);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Pending Approval</h1>
              <p className="text-sm text-slate-500 mt-1">
                Your account is waiting for an administrator to review and approve access.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5">
            <p className="text-xs font-medium text-slate-600">What happens next</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>An administrator will review your account</li>
              <li>You'll receive an email once approved</li>
              <li>This usually takes 1-2 business days</li>
            </ul>
          </div>

          {(profile?.first_name || user?.email) && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1">
              <p className="text-xs font-medium text-slate-600">Your information</p>
              <div className="text-xs text-slate-500 space-y-0.5">
                {profile?.first_name && <p>{profile.first_name} {profile.last_name}</p>}
                {user?.email && <p>{user.email}</p>}
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <Button
              onClick={checkApprovalStatus}
              disabled={checking}
              variant="outline"
              className="w-full h-10 rounded-xl text-sm font-medium"
            >
              {checking ? (
                <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Checking...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" />Check Approval Status</>
              )}
            </Button>

            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full h-10 rounded-xl text-sm text-slate-500 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
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
