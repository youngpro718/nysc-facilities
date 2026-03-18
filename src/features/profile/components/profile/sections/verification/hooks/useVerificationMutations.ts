
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { toast } from "sonner";
import { SelectedUser } from "./useVerificationState";

export function useVerificationMutations(
  refetchUsers: () => void
) {
  const handleVerification = async (
    userId: string,
    approved: boolean,
    selectedDepartment: string | null,
    selectedRole?: string
  ) => {
    try {
      if (approved) {
        // Use admin-selected role, or fall back to 'standard'
        const role = selectedRole || 'standard';
        const { error } = await supabase.rpc('approve_user_verification', {
          p_user_id: userId,
          p_role: role,
          p_admin_notes: null
        });

        if (error) throw error;
        
        toast.success('User approved successfully');
      } else {
        const { error } = await supabase.rpc('reject_user_verification', {
          p_user_id: userId,
          p_reason: null
        });

        if (error) throw error;
        
        toast.success('User rejected and removed');
      }
      
      refetchUsers();
    } catch (error) {
      logger.error('Error handling verification:', error);
      toast.error('Failed to process verification request');
      throw error;
    }
  };

  const handleBulkVerification = async (selectedUsers: SelectedUser[], approve: boolean, selectedDepartment: string | null, selectedRole?: string) => {
    if (approve && !selectedDepartment) {
      toast.error('Please select a department before approving users');
      return;
    }

    try {
      for (const user of selectedUsers) {
        await handleVerification(user.userId, approve, selectedDepartment, selectedRole);
      }
      
      const action = approve ? 'approved' : 'rejected and removed';
      toast.success(`${selectedUsers.length} users ${action} successfully`);
      refetchUsers();
    } catch (error) {
      logger.error('Error in bulk verification:', error);
      toast.error('Failed to process verification requests');
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      if (isAdmin) {
        // Check if role already exists
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select()
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (checkError) throw checkError;

        // Only insert if role doesn't exist
        if (!existingRole) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'admin'
            });

          if (roleError) throw roleError;
        }
      } else {
        // Remove admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (roleError) throw roleError;
      }
      
      refetchUsers();
    } catch (error) {
      logger.error('Error toggling admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
      if (error) throw error;

      toast.success('User deleted successfully');
      refetchUsers();
    } catch (error) {
      logger.error('Error deleting user:', error);
      toast.error('Failed to delete user', { description: getErrorMessage(error) });
    }
  };

  return {
    handleVerification,
    handleBulkVerification,
    handleToggleAdmin,
    handleDeleteUser
  };
}
