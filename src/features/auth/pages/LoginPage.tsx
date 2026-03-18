import { useState } from "react";
import { Loader2, Building2, Shield, Users, BarChart3 } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth";
import { logger } from "@/lib/logger";
import { APP_INFO } from "@/lib/appInfo";
import { AuthForm } from "@features/auth/components/auth/AuthForm";
import { cn } from "@/lib/utils";

const features = [
  { icon: Building2, label: "Spaces & Facilities", desc: "Manage floors, rooms, and building inventory" },
  { icon: BarChart3, label: "Court Operations", desc: "Schedule sessions, track assignments in real-time" },
  { icon: Shield, label: "Keys & Access", desc: "Issue passes, manage lockboxes and key history" },
  { icon: Users, label: "Team Management", desc: "Role-based access with admin approval workflow" },
];

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
      className="light min-h-[100dvh] flex"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-10 xl:p-14 bg-slate-900 text-white overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-600/15 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px]" />
        </div>
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <img src="/nysc-logo-dark.webp" alt="NYSC Logo" width={40} height={40} className="h-10 w-10 object-contain" />
          <div>
            <p className="font-semibold text-sm leading-none text-white">{APP_INFO.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">New York State Unified Court System</p>
          </div>
        </div>

        {/* Headline + features */}
        <div className="relative space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight">
              Manage every courthouse,<br />
              <span className="text-primary">in one place.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              A unified platform for facilities, operations, keys, and supply management — built for New York State court staff.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/[0.08] backdrop-blur-sm">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-none">{label}</p>
                  <p className="text-xs text-slate-400 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-[11px] text-slate-500">
            v{APP_INFO.version} &nbsp;·&nbsp; Built by {APP_INFO.creator.name} &nbsp;·&nbsp; Authorized use only
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center px-4 sm:px-8 bg-slate-50",
        "min-h-[100dvh] lg:min-h-0"
      )}>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img src="/nysc-logo-light.webp" alt="NYSC Logo" width={40} height={40} className="h-10 w-10 object-contain" />
          <div>
            <p className="font-semibold text-sm text-foreground">{APP_INFO.name}</p>
            <p className="text-xs text-muted-foreground">New York State Unified Court System</p>
          </div>
        </div>

        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? "Sign in to access the facilities hub"
                : "Request access — an admin will approve your account"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sm:p-7">
            <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Authorized use only. Activity may be monitored.
          </p>
        </div>

        <p className="lg:hidden mt-8 text-[10px] text-slate-400 text-center">
          v{APP_INFO.version} &nbsp;·&nbsp; Built by {APP_INFO.creator.name} &nbsp;·&nbsp;{' '}
          <a href={APP_INFO.support.emailHref} className="underline hover:text-slate-600">{APP_INFO.support.email}</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
