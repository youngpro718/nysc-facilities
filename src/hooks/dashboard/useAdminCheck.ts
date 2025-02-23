
import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthorizationError } from "./types/errors";

export const useAdminCheck = (shouldRedirect: boolean = true) => {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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

      const hasAdminRole = userRole.role === 'admin';
      setIsAdmin(hasAdminRole);

      // Only redirect and throw error if shouldRedirect is true and user is not admin
      if (shouldRedirect && !hasAdminRole) {
        navigate('/dashboard');
        throw new AuthorizationError('User does not have admin privileges');
      }
      
      // Clear any existing error if the check passes
      setError(null);
    } catch (error) {
      console.error('Error checking user role:', error);
      // Only set the error if shouldRedirect is true or if it's not an admin privileges error
      if (shouldRedirect || (error as Error).message !== 'User does not have admin privileges') {
        setError(error as Error);
      }
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, shouldRedirect]);

  useEffect(() => {
    checkUserRoleAndFetchData();
  }, [checkUserRoleAndFetchData]);

  return { isLoading, error, isAdmin, checkUserRoleAndFetchData };
};
