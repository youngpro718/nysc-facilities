
import { useQuery } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { UserDataError } from "./types/errors";
import type { UserProfile } from "@/types/dashboard";

export const useUserData = () => {
  // Get current user
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw new UserDataError(`Authentication error: ${authError.message}`);
        if (!user) throw new UserDataError('No authenticated user found');
        return user;
      } catch (error) {
        logger.error('Error fetching user data:', error);
        throw new UserDataError(error instanceof Error ? error.message : 'Failed to fetch user data');
      }
    },
    retry: 1,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch user profile with caching
  const { data: profile = {} as UserProfile } = useQuery<UserProfile>({
    queryKey: ['userProfile', userData?.id],
    queryFn: async () => {
      try {
        if (!userData?.id) throw new UserDataError('No user ID available');
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, title, avatar_url')
          .eq('id', userData.id)
          .maybeSingle();
        
        if (error) throw new UserDataError(`Profile fetch error: ${error.message}`);
        if (!data) throw new UserDataError('Profile not found');
        return data;
      } catch (error) {
        logger.error('Error fetching user profile:', error);
        throw new UserDataError(error instanceof Error ? error.message : 'Failed to fetch user profile');
      }
    },
    enabled: !!userData?.id,
    staleTime: 300000,
  });

  return { userData, userLoading, profile };
};
