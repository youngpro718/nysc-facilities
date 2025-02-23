
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuthCheck(isOpen: boolean) {
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) {
        setAuthError("No active session found. Please log in again.");
        return false;
      }
      setAuthError(null);
      return true;
    } catch (error: any) {
      console.error("Auth check error:", error);
      setAuthError(error.message || "Authentication error occurred");
      return false;
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  return {
    authError,
    checkAuth,
  };
}
