import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Mail, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * PendingApproval - Shown to users waiting for admin approval
 * 
 * After signup and email verification, users must wait for admin approval
 * before they can access the system.
 */
export default function PendingApproval() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  // Check if user has been approved
  const checkApprovalStatus = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('verification_status, is_approved')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data?.verification_status === 'verified' && data?.is_approved) {
        // User has been approved, redirect to dashboard
        navigate('/', { replace: true });
      } else if (data?.verification_status === 'rejected') {
        // User was rejected
        navigate('/auth/account-rejected', { replace: true });
      }
    } catch (error) {
      logger.error('Error checking approval status:', error);
    } finally {
      setChecking(false);
    }
  };

  // Check status on mount and periodically
  useEffect(() => {
    let mounted = true;

    const check = async () => {
      if (!mounted) return;
      await checkApprovalStatus();
    };

    check();
    
    // Check every 30 seconds
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account is waiting for administrator approval
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>What happens next?</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• An administrator will review your account</li>
                <li>• You'll receive an email when approved</li>
                <li>• This usually takes 1-2 business days</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Your Information</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Name:</strong> {profile?.first_name} {profile?.last_name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              {((profile as Record<string, unknown>))?.department && (
                <p><strong>Department:</strong> {((profile as Record<string, unknown>)).department}</p>
              )}
              {((profile as Record<string, unknown>))?.title && (
                <p><strong>Title:</strong> {((profile as Record<string, unknown>)).title}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={checkApprovalStatus}
              disabled={checking}
              className="w-full"
            >
              {checking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Approval Status
                </>
              )}
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
            Need help? Contact your administrator or email{' '}
            <a href="mailto:support@nysc.gov" className="text-primary underline">
              support@nysc.gov
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
