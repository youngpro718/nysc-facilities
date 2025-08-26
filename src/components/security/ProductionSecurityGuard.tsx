import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityCheck {
  warnings: string[];
  critical: string[];
  checked_at: string;
}

export function ProductionSecurityGuard() {
  const [securityStatus, setSecurityStatus] = useState<SecurityCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSecurityStatus();
  }, []);

  const checkSecurityStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('check_production_security');
      if (error) {
        console.error('Security check failed:', error);
        return;
      }
      setSecurityStatus(data as unknown as SecurityCheck);
    } catch (error) {
      console.error('Security check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for development bypass flags
  const hasDevBypasses = 
    import.meta.env.VITE_DISABLE_AUTH_GUARD === 'true' ||
    import.meta.env.VITE_DISABLE_RATE_LIMIT === 'true';

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Shield className="h-4 w-4 animate-pulse" />
        <span>Running security checks...</span>
      </div>
    );
  }

  const hasCriticalIssues = securityStatus?.critical && securityStatus.critical.length > 0;
  const hasWarnings = securityStatus?.warnings && securityStatus.warnings.length > 0;

  if (!hasCriticalIssues && !hasWarnings && !hasDevBypasses) {
    return null; // No security issues to display
  }

  return (
    <div className="space-y-4">
      {hasDevBypasses && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Bypasses Detected:</strong>
            <ul className="mt-2 list-disc list-inside">
              {import.meta.env.VITE_DISABLE_AUTH_GUARD === 'true' && (
                <li>Authentication guard is disabled</li>
              )}
              {import.meta.env.VITE_DISABLE_RATE_LIMIT === 'true' && (
                <li>Rate limiting is disabled</li>
              )}
            </ul>
            <p className="mt-2">These settings should be disabled in production environments.</p>
          </AlertDescription>
        </Alert>
      )}

      {hasCriticalIssues && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Security Issues:</strong>
            <ul className="mt-2 list-disc list-inside">
              {securityStatus.critical.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {hasWarnings && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Warnings:</strong>
            <ul className="mt-2 list-disc list-inside">
              {securityStatus.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}