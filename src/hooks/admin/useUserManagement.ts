/**
 * useUserManagement - Hook for admin user management operations
 * 
 * Provides:
 * - User list with roles
 * - User statistics (memoized)
 * - Approve/reject/unlock mutations
 * - Role change mutation
 * - Filtering helpers
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRateLimitManager } from '@/hooks/security/useRateLimitManager';
import { type UserRole, getRoleLabel } from '@/config/roles';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_approved: boolean;
  is_suspended: boolean;
  created_at: string;
  role: UserRole;
  department?: { name: string } | null;
}

export interface UserStats {
  total: number;
  pending: number;
  verified: number;
  suspended: number;
  admins: number;
}

export type FilterStatus = 'all' | 'pending' | 'verified' | 'suspended' | 'admins';

export function useUserManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { resetLoginAttempts } = useRateLimitManager();

  // Fetch all users with roles
  const {
    data: users = [],
    isLoading,
    error,
    refetch,
    isFetching: isRefreshing,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<UserProfile[]> => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`*, department:departments(name)`)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge roles into profiles
      const roleMap = new Map(userRoles?.map(r => [r.user_id, r.role]) || []);
      return (profiles || []).map(profile => ({
        ...profile,
        role: (roleMap.get(profile.id) as UserRole) || 'standard',
        department: (profile as any).department,
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Memoized user statistics
  const userStats = useMemo<UserStats>(() => ({
    total: users.length,
    pending: users.filter(u => u.verification_status === 'pending' || !u.is_approved).length,
    verified: users.filter(u => u.verification_status === 'verified' && u.is_approved && !u.is_suspended).length,
    suspended: users.filter(u => u.is_suspended).length,
    admins: users.filter(u => u.role === 'admin').length,
  }), [users]);

  // Filter users helper
  const filterUsers = useCallback((searchTerm: string, filterStatus: FilterStatus) => {
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        user.email?.toLowerCase().includes(searchLower) ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      switch (filterStatus) {
        case 'pending': return user.verification_status === 'pending' || !user.is_approved;
        case 'verified': return user.verification_status === 'verified' && user.is_approved && !user.is_suspended;
        case 'suspended': return user.is_suspended;
        case 'admins': return user.role === 'admin';
        default: return true;
      }
    });
  }, [users]);

  // Get user display name helper
  const getUserDisplayName = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'User';
    return user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user.email;
  }, [users]);

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('approve_user_verification', {
        p_user_id: userId,
        p_role: 'standard',
        p_admin_notes: 'Approved via admin panel'
      });
      if (error) throw error;
    },
    onMutate: (userId) => {
      toast.loading('Approving user...', { id: `approve-${userId}` });
    },
    onSuccess: (_, userId) => {
      const userName = getUserDisplayName(userId);
      toast.success(`✅ ${userName} has been approved!`, { id: `approve-${userId}` });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error, userId) => {
      const userName = getUserDisplayName(userId);
      toast.error(`❌ Failed to approve ${userName}`, { id: `approve-${userId}` });
    },
  });

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('reject_user_verification', {
        p_user_id: userId,
        p_admin_notes: 'Rejected via admin panel'
      });
      if (error) throw error;
    },
    onMutate: (userId) => {
      toast.loading('Rejecting user...', { id: `reject-${userId}` });
    },
    onSuccess: (_, userId) => {
      const userName = getUserDisplayName(userId);
      toast.success(`✅ ${userName} has been rejected`, { id: `reject-${userId}` });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error, userId) => {
      const userName = getUserDisplayName(userId);
      toast.error(`❌ Failed to reject ${userName}`, { id: `reject-${userId}` });
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });
      
      if (error) throw error;
      
      // Check if the function returned a success: false response
      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        throw new Error((data as any).message || 'Role update failed');
      }
      
      // Wait for database commit
      await new Promise(resolve => setTimeout(resolve, 500));
      return { userId, newRole };
    },
    onMutate: ({ userId, newRole }) => {
      const roleLabel = getRoleLabel(newRole);
      toast.loading(`Changing role to ${roleLabel}...`, { id: `role-${userId}` });
    },
    onSuccess: ({ userId, newRole }) => {
      const userName = getUserDisplayName(userId);
      const roleLabel = getRoleLabel(newRole);
      toast.success(`✅ ${userName} is now a ${roleLabel}!`, { id: `role-${userId}` });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any, { userId }) => {
      const userName = getUserDisplayName(userId);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`❌ Failed to change role for ${userName}: ${errorMessage}`, { id: `role-${userId}` });
    },
  });

  // Unlock account mutation
  const unlockAccountMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const success = await resetLoginAttempts(userEmail);
      if (!success) throw new Error('Failed to unlock account');
      return userEmail;
    },
    onMutate: (userEmail) => {
      toast.loading('Unlocking account...', { id: `unlock-${userEmail}` });
    },
    onSuccess: (userEmail) => {
      toast.success(`✅ Account unlocked for ${userEmail}`, { id: `unlock-${userEmail}` });
    },
    onError: (error: any, userEmail) => {
      toast.error(`❌ Failed to unlock account: ${error.message}`, { id: `unlock-${userEmail}` });
    },
  });

  // Refresh users
  const refreshUsers = useCallback(() => {
    toast.success('Refreshing user data...');
    refetch();
  }, [refetch]);

  return {
    // Data
    users,
    userStats,
    currentUserId: currentUser?.id || null,
    
    // Loading states
    isLoading,
    isRefreshing,
    error,
    
    // Helpers
    filterUsers,
    getUserDisplayName,
    refreshUsers,
    
    // Mutations
    approveUser: approveUserMutation.mutate,
    rejectUser: rejectUserMutation.mutate,
    changeRole: (userId: string, newRole: UserRole) => changeRoleMutation.mutate({ userId, newRole }),
    unlockAccount: unlockAccountMutation.mutate,
    
    // Mutation states
    isApproving: approveUserMutation.isPending,
    isRejecting: rejectUserMutation.isPending,
    isChangingRole: changeRoleMutation.isPending,
    isUnlocking: unlockAccountMutation.isPending,
    updatingUserId: changeRoleMutation.variables?.userId || null,
  };
}
