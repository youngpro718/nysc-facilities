import React, { useEffect, useState } from 'react';
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { SecureForm } from '@/components/security/SecureForm';
import { toast } from 'sonner';
import { useSecureAuth } from '@/hooks/security/useSecureAuth';
import { requestPasswordReset } from '@/services/auth';
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
  const { secureSignIn } = useSecureAuth();
  const [recentAccounts, setRecentAccounts] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    setRecentAccounts(getRecentAccounts());
  }, []);

  const handleSecureLogin = async (data: { email: string; password: string }) => {
    try {
      setLoading(true);
      await secureSignIn(data.email, data.password);
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

  const handleForgotPassword = async () => {
    const emailToReset = selectedEmail && selectedEmail !== 'other' ? selectedEmail : '';

    if (!emailToReset) {
      toast.info('Select a recent account first, then request a reset email.');
      return;
    }

    try {
      setResettingPassword(true);
      await requestPasswordReset(emailToReset);
      toast.success('Password reset email sent.', {
        description: `A reset link was sent to ${emailToReset}.`
      });
    } catch (error) {
      logger.error('Password reset request failed:', error);
      toast.error(getErrorMessage(error) || 'Unable to send reset email.');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
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
          className="text-primary hover:underline underline-offset-2 block mx-auto disabled:opacity-50"
          onClick={handleForgotPassword}
          disabled={resettingPassword}
        >
          {resettingPassword ? 'Sending reset email...' : 'Forgot password?'}
        </button>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground underline underline-offset-2 text-sm block mx-auto"
          onClick={() => toast.info('If you cannot access a saved account, an admin can also send you a reset email from Admin Center.')}
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
