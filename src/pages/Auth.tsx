
import { useState } from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Mail, Lock, Loader2 } from "lucide-react";
import { EvervaultCard } from "@/components/ui/evervault-card";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      // First, sign out to clear any invalid session
      await supabase.auth.signOut();
      
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;
        
        toast.success("Check your email for the confirmation link!", {
          description: "We've sent you an email to verify your account."
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        navigate("/", { replace: true });
        toast.success("Welcome back!", {
          description: "You've successfully signed in."
        });
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="absolute inset-0 flex items-center justify-center">
        <EvervaultCard text={isSignUp ? "Sign Up" : "Sign In"} className="w-full max-w-xl" />
      </div>
      
      <Card className="relative z-20 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-lg shadow-xl border border-white/20">
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
            <p className="text-white/80">
              {isSignUp ? "Create your account" : "Welcome back"}
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleAuth}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white pl-10 placeholder:text-white/50"
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-white/50" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white pl-10 placeholder:text-white/50"
                placeholder="Enter your password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-courthouse"
              />
              <Label
                htmlFor="remember"
                className="text-sm text-white font-normal"
              >
                Remember me
              </Label>
            </div>
            {!isSignUp && (
              <Button
                type="button"
                variant="link"
                className="text-white hover:text-white/80"
                onClick={() => toast.info("Password reset not implemented yet")}
              >
                Forgot password?
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              className="w-full bg-white text-courthouse hover:bg-white/90 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-courthouse px-2 text-white/60">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
              onClick={() => toast.info("Google sign-in not implemented yet")}
            >
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Sign in with Google
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Need an account? Create one"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
