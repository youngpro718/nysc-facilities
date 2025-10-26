import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

/**
 * VerifyEmail - Email Verification Page
 * 
 * Displays instructions for email verification and checks verification status.
 * Auto-refreshes when user verifies their email.
 */
export default function VerifyEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Check verification status periodically
    const interval = setInterval(checkVerification, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkVerification = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.email_confirmed_at) {
        setVerified(true);
        logger.debug('[VerifyEmail] Email verified, redirecting');
        toast({
          title: 'Email Verified',
          description: 'Your email has been verified successfully.',
        });
        setTimeout(() => navigate('/', { replace: true }), 1500);
      }
    } catch (error) {
      logger.error('[VerifyEmail] Check failed:', error);
    }
  };

  const handleResendEmail = async () => {
    try {
      setChecking(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast({
          title: 'Error',
          description: 'No email address found.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: 'Email Sent',
        description: 'Verification email has been resent. Please check your inbox.',
      });
    } catch (error: any) {
      logger.error('[VerifyEmail] Resend failed:', error);
      toast({
        title: 'Failed to Resend',
        description: error.message || 'Could not resend verification email.',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>Redirecting you to the app...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            Check your inbox and click the verification link
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              We've sent a verification email to your inbox. Click the link in the email to verify your account.
            </p>
            <p className="text-sm text-muted-foreground">
              This page will refresh automatically after verification.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Checking verification status...</span>
          </div>

          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleResendEmail}
              disabled={checking}
            >
              {checking ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
