
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/types/dashboard";

export const useUserData = () => {
  // Get current user
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');
      return user;
    },
    retry: 1,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch user profile with caching
  const { data: profile = {} as UserProfile } = useQuery<UserProfile>({
    queryKey: ['userProfile', userData?.id],
    queryFn: async () => {
      if (!userData?.id) throw new Error('No user ID available');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, title, avatar_url')
        .eq('id', userData.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.id,
    staleTime: 300000,
  });

  return { userData, userLoading, profile };
};
