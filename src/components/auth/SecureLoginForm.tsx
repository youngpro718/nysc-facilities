import React, { useState, useEffect } from 'react';
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { SecureForm } from '@/components/security/SecureForm';
import { toast } from 'sonner';
import { useSecureAuth } from '@/hooks/security/useSecureAuth';
import { User } from 'lucide-react';

interface SecureLoginFormProps {
  loading: boolean;
  setLoading: (value: boolean) => void;
  onToggleForm: () => void;
}

function getRecentAccounts(): string[] {
  try {
    return JSON.parse(localStorage.getItem('nysc-recent-accounts') || '[]');
  } catch {
    return [];
  }
}

function getInitials(email: string): string {
  const name = email.split('@')[0];
  return name.slice(0, 2).toUpperCase();
}

export const SecureLoginForm = ({
  loading,
  setLoading,
  onToggleForm,
}: SecureLoginFormProps) => {
  const { secureSignIn, isLoading: authLoading } = useSecureAuth();
  const [recentAccounts, setRecentAccounts] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>('');

  useEffect(() => {
    setRecentAccounts(getRecentAccounts());
  }, []);

  const handleSecureLogin = async (data: { email: string; password: string }) => {
    try {
      setLoading(true);
      
      const result = await secureSignIn(data.email, data.password);
      
      toast.success("Welcome back!", {
        description: "You've successfully signed in."
      });
    } catch (error) {
      logger.error("Auth error:", error);
      toast.error(getErrorMessage(error) || "Authentication failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (email: string) => {
    setSelectedEmail(email);
  };

  const handleRemoveAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    const updated = recentAccounts.filter(a => a !== email);
    localStorage.setItem('nysc-recent-accounts', JSON.stringify(updated));
    setRecentAccounts(updated);
    if (selectedEmail === email) setSelectedEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Account Picker — show saved accounts */}
      {recentAccounts.length > 0 && !selectedEmail && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Recent accounts</p>
          <div className="space-y-1.5">
            {recentAccounts.map((email) => (
              <button
                key={email}
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
                onClick={() => handleAccountSelect(email)}
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                  {getInitials(email)}
                </div>
                <span className="text-sm text-foreground truncate flex-1">{email}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity px-1"
                  onClick={(e) => handleRemoveAccount(e, email)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRemoveAccount(e as unknown as React.MouseEvent, email); }}
                >
                  ✕
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:bg-accent/30 transition-colors text-sm text-muted-foreground"
            onClick={() => setSelectedEmail('other')}
          >
            <User className="h-4 w-4" />
            Use a different account
          </button>
        </div>
      )}

      {/* Login form — shown when no recent accounts, or an account/other is selected */}
      {(recentAccounts.length === 0 || selectedEmail) && (
        <>
          {selectedEmail && selectedEmail !== 'other' && recentAccounts.length > 0 && (
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => setSelectedEmail('')}
            >
              ← Back to accounts
            </button>
          )}
          <SecureForm
            onSubmit={handleSecureLogin}
            isLoading={loading}
            title="Sign In"
            submitText="Sign In"
            defaultEmail={selectedEmail !== 'other' ? selectedEmail : undefined}
          />
        </>
      )}
      
      <div className="text-center space-y-2">
        <button
          type="button"
          className="text-primary hover:underline underline-offset-2 block mx-auto"
          onClick={() => toast.info("Please contact your administrator to reset your password")}
        >
          Forgot password?
        </button>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground underline underline-offset-2 text-sm block mx-auto"
          onClick={() => toast.info("Try a simpler password (6+ characters) or contact admin for account setup")}
        >
          Password issues?
        </button>
      </div>

      <button
        type="button"
        className="w-full text-primary hover:underline underline-offset-2 transition-colors p-2 rounded"
        onClick={onToggleForm}
        disabled={loading}
      >
        Need an account? Create one
      </button>
    </div>
  );
};
