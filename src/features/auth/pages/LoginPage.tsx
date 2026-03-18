
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@features/auth/components/auth/AuthForm";
import { Loader2, QrCode, Smartphone } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth";
import { logger } from "@/lib/logger";
import { APP_INFO, APP_COPYRIGHT } from "@/lib/appInfo";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // No longer forcing global light theme — login page uses scoped light class

  // Show loading while auth state is being determined
  if (isLoading) {
    logger.debug('[LoginPage] isLoading = true, showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render login form if already authenticated - let AuthProvider handle redirect
  if (isAuthenticated) {
    logger.debug('[LoginPage] isAuthenticated = true, showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  logger.debug('[LoginPage] Rendering login form');



  return (
    <div
      className="light min-h-[100dvh] relative w-full bg-background flex flex-col items-center justify-center px-4"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Subtle watermark in corner */}
      <img
        src="/lovable-uploads/ca12c24b-cc46-4318-b46d-8af88c0deae9.webp"
        alt="Court Seal Watermark"
        fetchpriority="high"
        width={96}
        height={96}
        className="pointer-events-none select-none absolute right-6 top-6 opacity-10 w-24 h-24 -z-10"
      />

      <Card className="w-full max-w-md p-6 sm:p-7 bg-card shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative h-12 w-12">
            {/* Light mode logo - navy blue */}
            <img
              src="/nysc-logo-light.webp"
              alt="NYSC Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain dark:hidden"
            />
            {/* Dark mode logo - light/white */}
            <img
              src="/nysc-logo-dark.webp"
              alt="NYSC Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain hidden dark:block"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">
              NYSC Facilities Hub
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Sign in to continue" : "Create your account"}
            </p>
          </div>
        </div>

        <AuthForm
          isLogin={isLogin}
          setIsLogin={setIsLogin}
        />

        <p className="mt-6 text-[11px] text-slate-500 text-center">
          Authorized use only. Activity may be monitored.
        </p>
      </Card>

      <p className="mt-4 text-[10px] text-slate-400 text-center">
        v{APP_INFO.version} &nbsp;·&nbsp; Built by {APP_INFO.creator.name} &nbsp;·&nbsp;{' '}
        <a href={APP_INFO.support.emailHref} className="underline hover:text-slate-600 transition-colors">
          {APP_INFO.support.email}
        </a>
      </p>
    </div>
  );
};

export default LoginPage;
