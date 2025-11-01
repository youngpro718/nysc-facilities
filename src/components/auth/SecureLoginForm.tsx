import React from 'react';
import { SecureForm } from '@/components/security/SecureForm';
import { toast } from 'sonner';
import { useSecureAuth } from '@/hooks/security/useSecureAuth';

interface SecureLoginFormProps {
  loading: boolean;
  setLoading: (value: boolean) => void;
  onToggleForm: () => void;
}

export const SecureLoginForm = ({
  loading,
  setLoading,
  onToggleForm,
}: SecureLoginFormProps) => {
  const { secureSignIn, isLoading: authLoading } = useSecureAuth();

  const handleSecureLogin = async (data: { email: string; password: string }) => {
    try {
      setLoading(true);
      
      const result = await secureSignIn(data.email, data.password);
      
      toast.success("Welcome back!", {
        description: "You've successfully signed in."
      });
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
      throw error; // Re-throw to let SecureForm handle it
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SecureForm
        onSubmit={handleSecureLogin}
        isLoading={loading}
        title="Sign In"
        submitText="Sign In"
      />
      
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