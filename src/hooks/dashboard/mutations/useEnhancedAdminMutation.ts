import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    try {
      // Check if user already has admin role
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select()
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRole) {
        toast.error('User already has admin privileges');
        return;
      }

      // Add admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (roleError) throw roleError;

      toast.success(`${userName} has been promoted to admin`);
      refetchUsers();
    } catch (error) {
      console.error('Error promoting user to admin:', error);
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
      console.error('Error demoting admin:', error);
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