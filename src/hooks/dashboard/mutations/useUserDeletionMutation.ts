
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useUserDeletionMutation(refetchUsers: () => void) {
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

  return { handleDeleteUser };
}
