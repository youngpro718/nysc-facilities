import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { secureSignIn, isLoading: authLoading } = useSecureAuth();

  const handleSecureLogin = async (data: { email: string; password: string }) => {
    try {
      setLoading(true);
      
      const result = await secureSignIn(data.email, data.password);

      // Navigate based on the authentication result
      navigate("/", { replace: true });
      
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
      
      <div className="text-center">
        <button
          type="button"
          className="text-white hover:text-white/80 underline"
          onClick={() => toast.info("Please contact your administrator to reset your password")}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="button"
        className="w-full text-white hover:bg-white/10 transition-colors p-2 rounded"
        onClick={onToggleForm}
        disabled={loading}
      >
        Need an account? Create one
      </button>
    </div>
  );
};