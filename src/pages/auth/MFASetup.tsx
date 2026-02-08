import { getErrorMessage } from "@/lib/errorUtils";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

/**
 * MFASetup - Multi-Factor Authentication Setup Page
 * 
 * Allows users to enable TOTP-based MFA for enhanced security.
 * Required for privileged roles (admin, cmc, coordinator, sergeant, facilities_manager).
 */
export default function MFASetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'intro' | 'setup' | 'verify'>('intro');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string>('');
  const [isPrivileged, setIsPrivileged] = useState(false);

  // Check if user has a privileged role that requires MFA
  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        const privilegedRoles = ['admin', 'cmc'];
        setIsPrivileged(!!data?.role && privilegedRoles.includes(data.role));
      } catch (err) {
        logger.warn('[MFASetup] Role check failed:', err);
      }
    };
    checkRole();
  }, []);

  const handleEnrollMFA = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'NYSC Facilities App',
      });

      if (enrollError) throw enrollError;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep('setup');
        logger.debug('[MFASetup] MFA enrollment initiated');
      }
    } catch (err) {
      logger.error('[MFASetup] Enrollment error:', err);
      setError(getErrorMessage(err) || 'Failed to start MFA setup');
      toast({
        title: 'Setup Failed',
        description: 'Could not initialize MFA setup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      setError('');

      if (!verificationCode || verificationCode.length !== 6) {
        setError('Please enter a valid 6-digit code');
        return;
      }

      const { data, error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      if (data) {
        logger.debug('[MFASetup] MFA verified successfully');
        toast({
          title: 'MFA Enabled',
          description: 'Two-factor authentication has been successfully enabled.',
        });
        setStep('verify');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      }
    } catch (err) {
      logger.error('[MFASetup] Verification error:', err);
      setError('Invalid verification code. Please try again.');
      toast({
        title: 'Verification Failed',
        description: 'The code you entered is incorrect. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (isPrivileged) {
      toast({
        title: 'MFA Required',
        description: 'Two-factor authentication is required for your role. Please complete setup.',
        variant: 'destructive',
      });
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'intro' && 'Enable Two-Factor Authentication'}
            {step === 'setup' && 'Scan QR Code'}
            {step === 'verify' && 'MFA Enabled!'}
          </CardTitle>
          <CardDescription>
            {step === 'intro' && 'Add an extra layer of security to your account'}
            {step === 'setup' && 'Use your authenticator app to scan the QR code'}
            {step === 'verify' && 'Your account is now protected with MFA'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Intro Step */}
          {step === 'intro' && (
            <>
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  You'll need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Install an authenticator app</p>
                    <p className="text-sm text-muted-foreground">Download from your app store if you don't have one</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Scan the QR code</p>
                    <p className="text-sm text-muted-foreground">We'll show you a QR code to scan with your app</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Enter verification code</p>
                    <p className="text-sm text-muted-foreground">Enter the 6-digit code from your app</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={handleEnrollMFA} disabled={loading} className="w-full">
                  {loading ? 'Setting up...' : 'Get Started'}
                </Button>
                {!isPrivileged && (
                  <Button variant="ghost" onClick={handleSkip} className="w-full">
                    Skip for now
                  </Button>
                )}
                {isPrivileged && (
                  <p className="text-xs text-center text-amber-600 font-medium">
                    MFA is required for your role and cannot be skipped.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Setup Step */}
          {step === 'setup' && (
            <>
              <div className="space-y-4">
                {/* QR Code */}
                {qrCode && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                  </div>
                )}

                {/* Manual Entry */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-1">Can't scan the code?</p>
                    <p className="text-xs">Enter this code manually in your app:</p>
                    <code className="block mt-2 p-2 bg-muted rounded text-xs break-all">
                      {secret}
                    </code>
                  </AlertDescription>
                </Alert>

                {/* Verification Input */}
                <div className="space-y-2">
                  <Label htmlFor="code">Enter 6-digit code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? 'Verifying...' : 'Verify and Enable'}
                </Button>
                <Button variant="ghost" onClick={() => setStep('intro')} className="w-full">
                  Back
                </Button>
              </div>
            </>
          )}

          {/* Success Step */}
          {step === 'verify' && (
            <>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-muted-foreground">
                  Your account is now protected with two-factor authentication. You'll be redirected to the dashboard shortly.
                </p>
              </div>

              <Button onClick={() => navigate('/', { replace: true })} className="w-full">
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
