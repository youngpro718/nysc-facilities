import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface UserStatistics {
  totalUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  usersWithIssues: number;
  adminUsers: number;
  verifiedUsers: number;
}

/**
 * Hook to fetch real-time user statistics for admin dashboard
 * Replaces hardcoded values with actual database queries
 */
export function useUserStatistics() {
  return useQuery({
    queryKey: ['user-statistics'],
    queryFn: async (): Promise<UserStatistics> => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, verification_status, is_approved, is_suspended');

      if (profilesError) throw profilesError;

      // Fetch admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(role => role.user_id) || []);

      // Calculate statistics
      const totalUsers = profiles?.length || 0;
      const pendingUsers = profiles?.filter(p => p.verification_status === 'pending').length || 0;
      const suspendedUsers = profiles?.filter(p => p.is_suspended === true).length || 0;
      const usersWithIssues = profiles?.filter(p => 
        p.verification_status === 'rejected' || p.is_approved === false
      ).length || 0;
      const adminUsers = profiles?.filter(p => adminUserIds.has(p.id)).length || 0;
      const verifiedUsers = profiles?.filter(p => 
        p.verification_status === 'verified' && p.is_approved === true
      ).length || 0;

      return {
        totalUsers,
        pendingUsers,
        suspendedUsers,
        usersWithIssues,
        adminUsers,
        verifiedUsers,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
