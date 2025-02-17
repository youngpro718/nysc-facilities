
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Department } from "./types";
import { SelectedUser } from "./useVerificationState";

export function useVerificationMutations(
  departments: Department[] | undefined,
  refetchUsers: () => void
) {
  const handleVerification = async (
    userId: string,
    approved: boolean,
    selectedDepartment: string | null
  ) => {
    try {
      if (approved) {
        // First update the profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .update({
            verification_status: 'verified',
            department_id: selectedDepartment,
            metadata: {
              employment_type: 'full_time',
              access_level: 'standard',
              start_date: new Date().toISOString().split('T')[0]
            }
          })
          .eq('id', userId)
          .select()
          .single();

        if (profileError) throw profileError;

        // Wait for the occupant creation to complete
        const { data: occupant, error: occupantError } = await supabase
          .from('occupants')
          .insert({
            id: userId,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            department: departments?.find(d => d.id === selectedDepartment)?.name,
            status: 'active',
            access_level: 'standard',
            employment_type: 'full_time',
            start_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (occupantError) {
          // Check if the error is due to the record already existing
          if (occupantError.code === '23505') { // Unique violation
            console.log('Occupant record already exists, continuing...');
          } else {
            throw occupantError;
          }
        }
        
        toast.success('User approved successfully');
      } else {
        // Delete from both profiles and users_metadata tables
        const { error: metadataError } = await supabase
          .from('users_metadata')
          .delete()
          .eq('id', userId);

        if (metadataError) throw metadataError;

        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) throw profileError;
        
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
      if (approve) {
        for (const user of selectedUsers) {
          await handleVerification(user.userId, true, selectedDepartment);
        }
        toast.success(`${selectedUsers.length} users approved successfully`);
      } else {
        // Delete from both profiles and users_metadata tables
        const userIds = selectedUsers.map(user => user.userId);
        
        const { error: metadataError } = await supabase
          .from('users_metadata')
          .delete()
          .in('id', userIds);

        if (metadataError) throw metadataError;

        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .in('id', userIds);

        if (profileError) throw profileError;
        
        toast.success(`${selectedUsers.length} users rejected and removed`);
      }

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

      // Delete user metadata
      const { error: metadataError } = await supabase
        .from('users_metadata')
        .delete()
        .eq('id', userId);

      if (metadataError) {
        console.error('Error deleting metadata:', metadataError);
      }

      // Finally delete the profile (this should cascade to auth.users)
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
