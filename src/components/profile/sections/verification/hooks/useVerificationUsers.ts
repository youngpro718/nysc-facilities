
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserVerificationView } from "./types";

export function useVerificationUsers() {
  const { 
    data: users, 
    isLoading: isLoadingUsers, 
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ['users-verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_verification_view')
        .select('*')
        .returns<UserVerificationView[]>();

      if (error) throw error;
      return data;
    }
  });

  return { users, isLoadingUsers, refetchUsers };
}
