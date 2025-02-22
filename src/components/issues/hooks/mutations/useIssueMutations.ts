
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IssueStatus } from "../../types/IssueTypes";
import { toast } from "sonner";

export const useIssueMutations = () => {
  const queryClient = useQueryClient();

  const updateIssueMutation = useMutation({
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
      console.error("Error updating issue:", error);
    }
  });

  const deleteIssueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success("Issue deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete issue");
      console.error("Error deleting issue:", error);
    }
  });

  return {
    updateIssueMutation,
    deleteIssueMutation,
  };
};
