
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";

export default function VerificationPending() {
  const navigate = useNavigate();

  return (
    <div className="h-screen relative w-full bg-courthouse flex flex-col items-center justify-center overflow-hidden">
      <Card className="relative z-20 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-lg shadow-xl border border-white/20">
        <div className="flex flex-col items-center gap-6 text-center text-white">
          <ClipboardCheck className="h-16 w-16" />
          <h1 className="text-2xl font-bold">Verification Pending</h1>
          <p className="text-white/80">
            Your account is pending verification by an administrator. You will receive an email once your account has been verified.
          </p>
          <Button
            variant="ghost"
            className="mt-4 text-white hover:bg-white/10"
            onClick={() => navigate("/auth")}
          >
            Return to Login
          </Button>
        </div>
      </Card>
    </div>
  );
}
