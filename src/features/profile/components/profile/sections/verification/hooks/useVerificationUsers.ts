
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
        .from('profiles') // Use existing table instead of non-existent view
        .select('*')
        .returns<UserVerificationView[]>();

      if (error) throw error;
      return data;
    }
  });

  return { users, isLoadingUsers, refetchUsers };
}
