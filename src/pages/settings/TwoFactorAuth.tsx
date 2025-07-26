import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Shield, Smartphone, Key, Download, Copy, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TwoFactorAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    checkMFAStatus();
  }, []);
  
  const checkMFAStatus = async () => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      setIsEnabled(factors?.totp?.length > 0);
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (enabled && !isEnabled) {
      await startMFASetup();
    } else if (!enabled && isEnabled) {
      await disableMFA();
    }
  };

  const startMFASetup = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });
      
      if (error) throw error;
      
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setShowSetup(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start MFA setup",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeMFASetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.[0];
      
      if (!factor) throw new Error('No MFA factor found');

      const { error } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: (factor as any).challenge?.id,
        code: verificationCode
      });

      if (error) throw error;

      setIsEnabled(true);
      setShowSetup(false);
      setVerificationCode("");
      toast({
        title: "Two-Factor Authentication Enabled",
        description: "Your account is now protected with 2FA."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disableMFA = async () => {
    try {
      setIsLoading(true);
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.[0];
      
      if (factor) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factor.id
        });
        
        if (error) throw error;
      }

      setIsEnabled(false);
      setShowSetup(false);
      toast({
        title: "Two-Factor Authentication Disabled",
        description: "Your account is now using single-factor authentication."
      });
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to disable 2FA",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({
      title: "Secret Copied",
      description: "The secret has been copied to your clipboard."
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9 sm:h-10 sm:w-10"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-semibold">Two-Factor Authentication</h1>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
              <Badge variant="secondary">Recommended</Badge>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        {isEnabled && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">2FA is enabled</span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Your account is protected with two-factor authentication
            </p>
          </div>
        )}

        {showSetup && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <h3 className="font-semibold">Setup Two-Factor Authentication</h3>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Step 1: Scan QR Code</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                
                {qrCode && (
                  <div className="flex flex-col items-center space-y-2">
                    <div 
                      className="p-2 bg-white rounded-lg"
                      dangerouslySetInnerHTML={{ __html: qrCode }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Can't scan? Use this secret key instead:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-xs">{secret}</code>
                      <Button size="sm" variant="ghost" onClick={copySecret}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Step 2: Enter Verification Code</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Enter the 6-digit code from your authenticator app
                </p>
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={completeMFASetup} 
                size="sm"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? "Verifying..." : "Complete Setup"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowSetup(false);
                  setVerificationCode("");
                  setQrCode("");
                  setSecret("");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}