import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface DeleteIssueParams {
  issueId: string;
  force?: boolean;
}

interface IssueData {
  id: string;
  data?: Array<{ id: string }>;
}

/**
 * Hook for deleting issues with proper error handling and loading state
 */
export const useDeleteIssueMutation = () => {
  const queryClient = useQueryClient();
  const [isDeleteInProgress, setIsDeleteInProgress] = useState(false);

  const deleteIssueMutation = useMutation({
    mutationFn: async ({ issueId, force = false }: DeleteIssueParams) => {
      setIsDeleteInProgress(true);
      
      try {
        // Check if the issue exists
        const { data: issueData, error: checkError } = await supabase
          .from('issues')
          .select('id')
          .eq('id', issueId)
          .single();
          
        if (checkError || !issueData) {
          throw new Error('Issue not found or already deleted');
        }
        
        if (force) {
          // Delete related records first
          await supabase
            .from('issue_comments')
            .delete()
            .eq('issue_id', issueId);

          await supabase
            .from('issue_history')
            .delete()
            .eq('issue_id', issueId);

          // Mark as resolved before deletion
          await supabase
            .from('issues')
            .update({ 
              status: 'resolved',
              resolution_notes: 'Automatically resolved before deletion'
            })
            .eq('id', issueId);
        }

        // Delete the issue
        const { error: issueError } = await supabase
          .from('issues')
          .delete()
          .eq('id', issueId);
          
        if (issueError) {
          throw new Error(issueError.message || 'Failed to delete issue');
        }
        
        return { success: true, message: 'Issue deleted successfully', issueId };
      } finally {
        setIsDeleteInProgress(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issue', data.issueId] });
      
      queryClient.setQueryData(['issues'], (oldData: IssueData | undefined) => {
        if (!oldData || !oldData.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((issue) => issue.id !== data.issueId)
        };
      });
      
      toast.success("Issue deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete issue: ${error.message}`);
    },
  });

  return { 
    deleteIssueMutation, 
    isDeleteInProgress 
  };
};
