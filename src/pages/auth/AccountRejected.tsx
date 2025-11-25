import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * AccountRejected - Shown to users whose account was rejected
 */
export default function AccountRejected() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Account Not Approved</CardTitle>
          <CardDescription>
            Your account request was not approved
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Your account request has been reviewed and was not approved for access to the NYSC Facilities system.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">What you can do:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Contact your supervisor to verify your eligibility</li>
              <li>• Reach out to the facilities administrator</li>
              <li>• Submit a new request with correct information</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = 'mailto:support@nysc.gov?subject=Account%20Rejection%20Appeal'}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Administrator
            </Button>

            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If you believe this was a mistake, please contact{' '}
            <a href="mailto:support@nysc.gov" className="text-primary underline">
              support@nysc.gov
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
