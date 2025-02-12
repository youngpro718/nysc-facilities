
import { useState, useEffect } from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Mail, Lock, Loader2 } from "lucide-react";
import { EvervaultCard } from "@/components/ui/evervault-card";

// Add your email for development
const ALLOWED_DOMAINS = ["state.gov", "nyc.gov", "gmail.com"]; // Temporarily allow gmail.com for development

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      }
    });
  }, [navigate]);

  const validateEmail = (email: string) => {
    const domain = email.split('@')[1];
    return ALLOWED_DOMAINS.includes(domain);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Only government email addresses are allowed", {
        description: `Please use an email from: ${ALLOWED_DOMAINS.join(", ")}`
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            is_approved: false, // Requires admin approval
          }
        },
      });

      if (error) throw error;
      
      toast.success("Check your email for the confirmation link!", {
        description: "Your account will need to be approved by an administrator."
      });
      
      // Redirect to login page after successful signup
      navigate("/login");
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Signup failed");
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

      <Card className="relative z-20 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 group/card">
        <div
          className="absolute inset-0 -z-10"
          style={{ margin: '-1px' }}
        >
          <EvervaultCard text="Sign Up" />
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
            <p className="text-white/80">Create your account</p>
            <p className="text-sm text-white/60 mt-2">
              Only government email addresses are allowed
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSignup}>
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
                autoComplete="new-password"
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
              Create Account
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-white hover:bg-white/10 transition-colors"
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              Already have an account? Sign in
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
