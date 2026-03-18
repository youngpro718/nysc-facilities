import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export function useEnhancedAdminMutation(refetchUsers: () => void) {
  const getCurrentUserId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  const getAdminCount = async (): Promise<number> => {
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');
    return count || 0;
  };

  const promoteToAdmin = async (userId: string, userName: string): Promise<void> => {
    logger.debug('[useEnhancedAdminMutation] Promoting user to admin:', { userId, userName });
    
    try {
      // Use unified RPC function
      const { data, error } = await supabase
        .rpc('promote_to_admin', { target_user_id: userId });

      if (error) {
        logger.error('[useEnhancedAdminMutation] RPC error:', error);
        throw error;
      }

      if (!data?.success) {
        const errorMsg = data?.message || 'Failed to promote user';
        logger.error('[useEnhancedAdminMutation] RPC returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      logger.debug('[useEnhancedAdminMutation] Successfully promoted user:', data);
      toast.success(`${userName} has been promoted to admin`);
      refetchUsers();
    } catch (error) {
      logger.error('[useEnhancedAdminMutation] Error promoting user to admin:', error);
      toast.error('Failed to promote user to admin');
      throw error;
    }
  };

  const demoteFromAdmin = async (userId: string, userName: string): Promise<void> => {
    try {
      const currentUserId = await getCurrentUserId();
      
      // Prevent self-demotion
      if (userId === currentUserId) {
        toast.error('You cannot remove your own admin privileges');
        return;
      }

      // Check if this is the last admin
      const adminCount = await getAdminCount();
      if (adminCount <= 1) {
        toast.error('Cannot remove the last admin user');
        return;
      }

      // Remove admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (roleError) throw roleError;

      toast.success(`${userName} admin privileges have been revoked`);
      refetchUsers();
    } catch (error) {
      logger.error('Error demoting admin:', error);
      toast.error('Failed to remove admin privileges');
      throw error;
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean): Promise<void> => {
    // This is the legacy function - we should migrate to use promoteToAdmin/demoteFromAdmin
    try {
      if (isAdmin) {
        await promoteToAdmin(userId, 'User');
      } else {
        await demoteFromAdmin(userId, 'User');
      }
    } catch (error) {
      // Error handling is done in the individual functions
    }
  };

  return { 
    promoteToAdmin,
    demoteFromAdmin,
    handleToggleAdmin,
    getCurrentUserId,
    getAdminCount
  };
}