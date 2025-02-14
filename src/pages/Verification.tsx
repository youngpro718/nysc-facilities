
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { VerificationRequestForm } from "@/components/verification/VerificationRequestForm";

export default function Verification() {
  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Agency Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xl mx-auto">
            <p className="text-muted-foreground mb-6">
              Please provide your agency affiliation details for verification. Once submitted,
              your request will be reviewed by our team.
            </p>
            <VerificationRequestForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
