
import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useAdminCheck = () => {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkUserRoleAndFetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) throw roleError;

      if (userRole?.role !== 'admin') {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkUserRoleAndFetchData();
  }, [checkUserRoleAndFetchData]);

  return { isLoading, error, checkUserRoleAndFetchData };
};
