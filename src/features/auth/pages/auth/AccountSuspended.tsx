import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@features/auth/hooks/useAuth';
import { APP_INFO } from '@/lib/appInfo';

/**
 * AccountSuspended - Shown to users whose account has been suspended.
 */
export default function AccountSuspended() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Account Suspended</h1>
              <p className="text-sm text-slate-500 mt-1">
                Your account access has been temporarily suspended by an administrator.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5">
            <p className="text-xs font-medium text-slate-600">What to do next</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>Contact your administrator to understand why access was suspended</li>
              <li>Resolve any outstanding issues with your supervisor</li>
              <li>Reach out to support if you believe this is a mistake</li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <Button
              onClick={() => (window.location.href = APP_INFO.support.emailHref)}
              className="w-full h-10 rounded-xl text-sm font-medium"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Administrator
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
          Need help? Contact{' '}
          <a href={APP_INFO.support.emailHref} className="underline hover:text-slate-600 transition-colors">
            {APP_INFO.support.email}
          </a>
        </p>
      </div>
    </div>
  );
}
