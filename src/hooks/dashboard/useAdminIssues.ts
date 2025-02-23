
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserIssue } from "@/types/dashboard";

export const useAdminIssues = () => {
  const { data: allIssues = [] } = useQuery<UserIssue[]>({
    queryKey: ['allIssues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  return { allIssues };
};
