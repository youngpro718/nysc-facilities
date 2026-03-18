
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { toast } from "sonner";

export function useUserDeletionMutation(refetchUsers: () => void) {
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

  return { handleDeleteUser };
}
