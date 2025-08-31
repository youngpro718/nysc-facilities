import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

  if (!hasCriticalIssues && !hasWarnings) {
    return null; // No security issues to display
  }

  return (
    <div className="space-y-4">

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