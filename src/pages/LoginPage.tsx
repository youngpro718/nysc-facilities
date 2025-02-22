
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SparklesCore } from "@/components/ui/sparkles";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { EvervaultCard } from "@/components/ui/evervault-card";
import { AuthForm } from "@/components/auth/AuthForm";
import { delay } from "@/utils/timing";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await delay(100); // Small delay to ensure auth state is stable
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isChecking) {
    return null;
  }

  return (
    <div className="h-screen relative w-full bg-courthouse flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
          speed={1}
        />
      </div>

      <Card className="relative z-20 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 group/card">
        <div className="absolute inset-0 -z-10" style={{ margin: '-1px' }}>
          <EvervaultCard text={isLogin ? "Sign In" : "Sign Up"} />
        </div>
        
        <div className="flex flex-col items-center gap-6 mb-8">
          <img 
            src="/lovable-uploads/ca12c24b-cc46-4318-b46d-8af88c0deae9.png" 
            alt="NYSC Logo" 
            className="h-20 w-20"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              NYSC Facilities Hub
            </h1>
            <p className="text-white/80">{isLogin ? "Welcome back" : "Create your account"}</p>
          </div>
        </div>

        <AuthForm isLogin={isLogin} setIsLogin={setIsLogin} />
      </Card>
    </div>
  );
};

export default LoginPage;
