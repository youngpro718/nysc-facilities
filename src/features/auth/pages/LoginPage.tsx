import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@features/auth/hooks/useAuth";
import { logger } from "@/lib/logger";
import { APP_INFO } from "@/lib/appInfo";
import { AuthForm } from "@features/auth/components/auth/AuthForm";
import "@/styles/login-bg.css";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading || isAuthenticated) {
    logger.debug('[LoginPage] loading or authenticated, showing spinner');
    return (
      <div className="light flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="login-bg min-h-[100dvh] flex flex-col items-center justify-center px-4"
      style={{
        colorScheme: 'light',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Center glow behind card */}
      <div className="login-glow" />

      <motion.div
        className="w-full max-w-[420px] space-y-7 relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo lockup — centered hero */}
        <motion.div
          className="flex flex-col items-center text-center space-y-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src="/nysc-logo-dark.webp"
            alt="NYSC Logo"
            width={72}
            height={72}
            className="h-[72px] w-[72px] object-cover rounded-full ring-1 ring-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
          />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {APP_INFO.name}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {APP_INFO.organization}
            </p>
          </div>
        </motion.div>

        {/* Form card — frosted glass */}
        <motion.div
          className="light login-card rounded-md p-6 sm:p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />
        </motion.div>

        {/* Security notice */}
        <motion.p
          className="text-center text-[11px] text-slate-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          Authorized use only. Activity may be monitored.
        </motion.p>
      </motion.div>

      {/* Footer */}
      <motion.p
        className="mt-10 text-[10px] text-slate-400 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        v{APP_INFO.version} &nbsp;·&nbsp; {APP_INFO.creator.name} &nbsp;·&nbsp;{' '}
        <a href={APP_INFO.support.emailHref} className="underline hover:text-slate-200 transition-colors">
          {APP_INFO.support.email}
        </a>
      </motion.p>
    </div>
  );
};

export default LoginPage;
