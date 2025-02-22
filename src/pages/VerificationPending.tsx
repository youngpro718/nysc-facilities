
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SparklesCore } from "@/components/ui/sparkles";

export default function VerificationPending() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (profile?.verification_status === 'verified') {
          toast.success("Your account has been verified!");
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    };

    // Check initial status
    checkVerificationStatus();

    // Subscribe to profile changes
    const subscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
        },
        (payload) => {
          if (payload.new.verification_status === 'verified') {
            toast.success("Your account has been verified!");
            navigate("/");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [navigate]);

  const handleCheckStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (profile?.verification_status === 'verified') {
        toast.success("Your account has been verified!");
        navigate("/");
      } else {
        toast.info("Your account is still pending verification");
      }
    } catch (error) {
      console.error("Error checking status:", error);
      toast.error("Failed to check verification status");
    }
  };

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
              onClick={() => {
                supabase.auth.signOut();
                navigate("/login");
              }}
            >
              Return to Login
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

