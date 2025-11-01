
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useAdminMutation(refetchUsers: () => void) {
  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      if (isAdmin) {
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select()
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (checkError) throw checkError;

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

  return { handleToggleAdmin };
}
