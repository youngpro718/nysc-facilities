
import { CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

export function VerificationHeader() {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <UserCheck className="h-5 w-5" />
        Verification Requests
      </CardTitle>
    </CardHeader>
  );
}
