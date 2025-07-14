
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Loader2 } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative w-full bg-courthouse flex flex-col items-center justify-center overflow-hidden">
      <SparklesCore
        id="tsparticlesfullpage"
        background="transparent"
        minSize={0.6}
        maxSize={1.4}
        particleDensity={100}
        className="w-full h-full absolute"
        particleColor="#FFFFFF"
      />
      
      <Card className="relative z-20 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-lg shadow-xl border border-white/20">
        <div className="flex flex-col items-center gap-6 text-center text-white">
          <div className="relative">
            <ClipboardCheck className="h-16 w-16" />
            <div className="absolute -top-2 -right-2">
              <Loader2 className="h-6 w-6 animate-spin text-white/80" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Verification Pending</h1>
          <p className="text-white/80">
            Your account is pending verification by an administrator. You will be automatically redirected once your account has been verified.
          </p>
          <div className="flex flex-col gap-4 w-full">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={handleCheckStatus}
            >
              Check Status
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={handleSignOut}
            >
              Return to Login
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
