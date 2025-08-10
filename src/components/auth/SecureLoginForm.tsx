import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SecureForm } from '@/components/security/SecureForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { delay } from '@/utils/timing';
import { normalizeSupabaseError } from '@/lib/supabaseErrors';

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

  const handleSecureLogin = async (data: { email: string; password: string }) => {
    try {
      setLoading(true);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      // Add a small delay to ensure auth state is updated
      await delay(100);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      // Check verification status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.verification_status === 'pending') {
        navigate("/verification-pending", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

      toast.success("Welcome back!", {
        description: "You've successfully signed in."
      });
    } catch (error: any) {
      console.error("Auth error:", error);
      const normalized = normalizeSupabaseError(error);
      toast.error(normalized.userMessage, { description: normalized.message });
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