
import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthorizationError } from "./types/errors";

export const useAdminCheck = () => {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkUserRoleAndFetchData = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new AuthorizationError(`Authentication error: ${authError.message}`);
      if (!user) {
        navigate('/login');
        throw new AuthorizationError('No authenticated user found');
      }

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) throw new AuthorizationError(`Role check error: ${roleError.message}`);
      if (!userRole) throw new AuthorizationError('No role found for user');

      if (userRole.role !== 'admin') {
        navigate('/dashboard');
        throw new AuthorizationError('User does not have admin privileges');
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
