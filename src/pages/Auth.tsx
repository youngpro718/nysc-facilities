import { useState } from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Mail, Lock, Loader2 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
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