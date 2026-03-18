
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { IssueStatus } from "../../types/IssueTypes";
import { toast } from "sonner";

export const useUpdateIssueMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IssueStatus }) => {
      const { error } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success("Issue status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update issue status");
      logger.error("Error updating issue:", error);
    }
  });
};
