
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import { SparklesCore } from "@/components/ui/sparkles";
import { useAuth } from "@/hooks/useAuth";

export default function VerificationPending() {
  const navigate = useNavigate();
  const { user, profile, refreshSession, signOut, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect if loading or if user doesn't exist
    if (isLoading || !user) return;
    
    // If user is verified, let AuthProvider handle the redirect
    if (profile?.verification_status === 'verified') {
      toast.success("Your account has been verified!");
      // AuthProvider will handle the redirect in its effect
    }
  }, [user, profile?.verification_status, isLoading]);

  const handleCheckStatus = async () => {
    try {
      await refreshSession();
      
      if (profile?.verification_status === 'verified') {
        toast.success("Your account has been verified!");
        // AuthProvider will handle the redirect automatically
      } else {
        toast.info("Your account is still pending verification");
      }
    } catch (error) {
      console.error("Error checking status:", error);
      toast.error("Failed to check verification status");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleExploreFeatures = () => {
    navigate('/features-preview');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative w-full flex flex-col items-center justify-center overflow-hidden">
      <SparklesCore
        id="tsparticlesfullpage"
        background="transparent"
        minSize={0.6}
        maxSize={1.4}
        particleDensity={100}
        className="w-full h-full absolute"
        particleColor="#FFFFFF"
      />
      
      <Card className="relative z-20 w-full max-w-lg p-8">
        <div className="flex flex-col items-center gap-6 text-center text-foreground">
          <div className="relative">
            <CheckCircle className="h-16 w-16" />
            <div className="absolute -top-2 -right-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Welcome to NYSC Facilities Hub!</h1>
            <p className="text-muted-foreground">
              Your account has been created successfully. While we verify your information, 
              you can explore the platform and see what features are available.
            </p>
          </div>

          <div className="w-full p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium text-sm">Limited Access Active</p>
                <p className="text-xs text-muted-foreground">
                  You can browse and learn about features while verification is in progress
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full">
            <Button onClick={handleExploreFeatures} className="flex items-center gap-2">
              Explore Features
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" onClick={handleCheckStatus}>
              Check Verification Status
            </Button>
            
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
              Return to Login
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
