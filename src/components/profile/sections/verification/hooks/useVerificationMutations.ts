
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SelectedUser } from "./useVerificationState";

export function useVerificationMutations(
  refetchUsers: () => void
) {
  const handleVerification = async (
    userId: string,
    approved: boolean,
    selectedDepartment: string | null
  ) => {
    try {
      if (approved) {
        // Note: The database function expects p_role, not p_department_id
        // For now, using 'standard' as default role
        const { error } = await supabase.rpc('approve_user_verification', {
          p_user_id: userId,
          p_role: 'standard',
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
      console.error('Error handling verification:', error);
      toast.error('Failed to process verification request');
      throw error;
    }
  };

  const handleBulkVerification = async (selectedUsers: SelectedUser[], approve: boolean, selectedDepartment: string | null) => {
    if (approve && !selectedDepartment) {
      toast.error('Please select a department before approving users');
      return;
    }

    try {
      for (const user of selectedUsers) {
        await handleVerification(user.userId, approve, selectedDepartment);
      }
      
      const action = approve ? 'approved' : 'rejected and removed';
      toast.success(`${selectedUsers.length} users ${action} successfully`);
      refetchUsers();
    } catch (error) {
      console.error('Error in bulk verification:', error);
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
      console.error('Error toggling admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete occupant record if exists
      const { error: occupantError } = await supabase
        .from('occupants')
        .delete()
        .eq('id', userId);

      if (occupantError && occupantError.code !== '23503') {
        console.error('Error deleting occupant:', occupantError);
      }

      // Delete user roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error deleting roles:', rolesError);
      }

      // Delete verification requests
      const { error: verificationError } = await supabase
        .from('verification_requests')
        .delete()
        .eq('user_id', userId);

      if (verificationError) {
        console.error('Error deleting verification request:', verificationError);
      }

      // Delete the profile (this should cascade to auth.users)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success('User deleted successfully');
      refetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  return {
    handleVerification,
    handleBulkVerification,
    handleToggleAdmin,
    handleDeleteUser
  };
}
