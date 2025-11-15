import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecurityStatusAlertProps {
  className?: string;
}

export function SecurityStatusAlert({ className }: SecurityStatusAlertProps) {
  return (
    <div className={className}>
      <Alert variant="destructive" className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="font-medium">Security Configuration Required</p>
              <p className="text-sm">
                Leaked password protection is currently disabled. This security feature helps prevent users from using compromised passwords.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-2 border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
              >
                <a
                  href="https://supabase.com/dashboard/project/fmymhtuiqzhupjyopfvi/auth/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Enable leaked password protection in Supabase Dashboard"
                >
                  <Shield className="mr-2 h-3 w-3" />
                  Enable in Supabase Dashboard
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}