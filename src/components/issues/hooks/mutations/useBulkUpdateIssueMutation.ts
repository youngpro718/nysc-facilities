import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IssueStatus } from "../../types/IssueTypes";
import { toast } from "sonner";

type IssuePriority = "low" | "medium" | "high";

interface BulkUpdateParams {
  issueIds: string[];
  updates: {
    status?: IssueStatus;
    assigned_to?: string;
    priority?: IssuePriority;
  };
}

export const useBulkUpdateIssueMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ issueIds, updates }: BulkUpdateParams) => {
      const { error } = await supabase
        .from('issues')
        .update(updates)
        .in('id', issueIds);
      
      if (error) throw error;
      
      return { updatedCount: issueIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['admin-issues'] });
      toast.success(`Successfully updated ${data.updatedCount} issues`);
    },
    onError: (error) => {
      toast.error("Failed to update issues");
      console.error("Error updating issues:", error);
    }
  });
};