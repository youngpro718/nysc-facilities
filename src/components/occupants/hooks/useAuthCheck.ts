
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuthCheck(isOpen: boolean) {
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAuth = async () => {
    if (!isOpen) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setAuthError("No active session. Please refresh the page.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    checkAuth();
  }, [isOpen]);

  return {
    authError: authError !== null, // Convert string to boolean
    authErrorMessage: authError,   // Keep the original error message
    checkAuth
  };
}
