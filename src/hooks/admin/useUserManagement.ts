import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  access_level: 'none' | 'read' | 'write' | 'admin';
  verification_status: 'pending' | 'verified' | 'rejected';
  is_approved: boolean;
  created_at: string;
  last_login_at: string | null;
  department: string | null;
  title: string | null;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  adminUsers: number;
  securityAlerts: number;
}

export function useUserManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all users
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          access_level,
          verification_status,
          is_approved,
          created_at,
          last_login_at,
          department,
          title
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as User[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate user statistics
  const userStats: UserStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_approved && u.access_level !== 'none').length,
    pendingApprovals: users.filter(u => !u.is_approved || u.verification_status === 'pending').length,
    adminUsers: users.filter(u => u.access_level === 'admin').length,
    securityAlerts: users.filter(u => u.verification_status === 'rejected').length,
  };

  // Get admin users specifically
  const adminUsers = users.filter(u => u.access_level === 'admin');

  // Promote user to admin
  const promoteToAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          access_level: 'admin',
          is_approved: true 
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Demote user from admin
  const demoteFromAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ access_level: 'write' })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Approve user
  const approveUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_approved: true,
          access_level: 'read' // Default to read access
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Reject user
  const rejectUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_approved: false,
          verification_status: 'rejected'
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Update user access level
  const updateAccessLevel = useMutation({
    mutationFn: async ({ userId, accessLevel }: { userId: string; accessLevel: User['access_level'] }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ access_level: accessLevel })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    // Data
    users,
    adminUsers,
    userStats,
    currentUserId: currentUser?.id || null,
    
    // Loading states
    isLoading: usersLoading,
    error: usersError,
    
    // Mutations
    promoteToAdmin: promoteToAdmin.mutate,
    demoteFromAdmin: demoteFromAdmin.mutate,
    approveUser: approveUser.mutate,
    rejectUser: rejectUser.mutate,
    updateAccessLevel: updateAccessLevel.mutate,
    
    // Mutation states
    isPromoting: promoteToAdmin.isPending,
    isDemoting: demoteFromAdmin.isPending,
    isApproving: approveUser.isPending,
    isRejecting: rejectUser.isPending,
    isUpdatingAccess: updateAccessLevel.isPending,
  };
}
