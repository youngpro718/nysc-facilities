import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth";
import { logger } from "@/lib/logger";
import { APP_INFO } from "@/lib/appInfo";
import { AuthForm } from "@features/auth/components/auth/AuthForm";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading || isAuthenticated) {
    logger.debug('[LoginPage] loading or authenticated, showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="light min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-slate-50"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="w-full max-w-[400px] space-y-6">
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0">
            <img src="/nysc-logo-light.webp" alt="NYSC Logo" width={44} height={44} className="h-full w-full object-contain dark:hidden" />
            <img src="/nysc-logo-dark.webp" alt="NYSC Logo" width={44} height={44} className="h-full w-full object-contain hidden dark:block" />
          </div>
          <div>
            <p className="font-semibold text-base text-foreground leading-none">{APP_INFO.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">New York State Unified Court System</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-7">
          <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Authorized use only. Activity may be monitored.
        </p>
      </div>

      <p className="mt-8 text-[10px] text-slate-400 text-center">
        v{APP_INFO.version} &nbsp;·&nbsp; {APP_INFO.creator.name} &nbsp;·&nbsp;{' '}
        <a href={APP_INFO.support.emailHref} className="underline hover:text-slate-600 transition-colors">
          {APP_INFO.support.email}
        </a>
      </p>
    </div>
  );
};

export default LoginPage;
