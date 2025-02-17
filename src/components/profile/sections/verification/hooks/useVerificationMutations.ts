
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Department } from "./types";

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

        // Then create the occupant record
        const { error: occupantError } = await supabase
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
          });

        if (occupantError) throw occupantError;
        
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
    }
  };

  const handleBulkVerification = async (selectedUsers: string[], approve: boolean, selectedDepartment: string | null) => {
    if (approve && !selectedDepartment) {
      toast.error('Please select a department before approving users');
      return;
    }

    try {
      if (approve) {
        for (const userId of selectedUsers) {
          await handleVerification(userId, true, selectedDepartment);
        }
        toast.success(`${selectedUsers.length} users approved successfully`);
      } else {
        // Delete from both profiles and users_metadata tables
        const { error: metadataError } = await supabase
          .from('users_metadata')
          .delete()
          .in('id', selectedUsers);

        if (metadataError) throw metadataError;

        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .in('id', selectedUsers);

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
      // Delete the auth user (this will cascade to profiles and other related data)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;
      
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
