
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminRoles() {
  const { data: adminRoles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (error) throw error;
      return data.map(role => role.user_id);
    }
  });

  return { adminRoles };
}
