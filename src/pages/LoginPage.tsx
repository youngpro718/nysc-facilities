
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/AuthForm";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isLoading, isAuthenticated } = useAuth();

  // Force light theme while on the login page to ensure input backgrounds and text
  // use light variables (prevents dark inputs on light backgrounds)
  useEffect(() => {
    const root = document.documentElement;
    const prevClassName = root.className;
    root.classList.remove("dark", "blue", "green", "purple");
    root.classList.add("light");
    return () => {
      root.className = prevClassName;
    };
  }, []);

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render login form if already authenticated - let AuthProvider handle redirect
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }



  return (
    <div className="min-h-screen relative w-full bg-background flex flex-col items-center justify-center px-4">
      {/* Subtle watermark in corner */}
      <img
        src="/lovable-uploads/ca12c24b-cc46-4318-b46d-8af88c0deae9.png"
        alt="Court Seal Watermark"
        className="pointer-events-none select-none absolute right-6 top-6 opacity-10 w-24 h-24 -z-10"
      />

      <Card className="w-full max-w-md p-6 sm:p-7 bg-card shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/lovable-uploads/ca12c24b-cc46-4318-b46d-8af88c0deae9.png"
            alt="NYSC Logo"
            className="h-10 w-10"
          />
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
    </div>
  );
};

export default LoginPage;
