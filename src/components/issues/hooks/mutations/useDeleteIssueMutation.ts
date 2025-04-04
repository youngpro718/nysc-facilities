
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DeleteIssueParams {
  issueId: string;
  force?: boolean;
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
      console.log(`Deleting issue with ID: ${issueId}${force ? ' (force mode)' : ''}`);
      
      try {
        // First, try to delete directly
        const { error: commentsError } = await supabase
          .from('issue_comments')
          .delete()
          .eq('issue_id', issueId);
          
        if (commentsError && !force) {
          console.warn('Error deleting comments:', commentsError);
        }

        const { error: historyError } = await supabase
          .from('issue_history')
          .delete()
          .eq('issue_id', issueId);
          
        if (historyError && !force) {
          console.warn('Error deleting history:', historyError);
        }

        // Finally delete the issue itself
        const { error: issueError } = await supabase
          .from('issues')
          .delete()
          .eq('id', issueId);
          
        if (issueError) {
          console.error('Error deleting issue:', issueError);
          
          if (force) {
            // If force is true, we perform a more careful deletion
            // This is a fallback for when constraints prevent deletion
            console.log('Using force delete approach for issue with ID:', issueId);
            
            // Additional cleanup might be needed here if constraints are complex
            // For now we're just retrying the deletion
            const { error: forceDeleteError } = await supabase
              .from('issues')
              .delete()
              .eq('id', issueId);
              
            if (forceDeleteError) {
              throw new Error(`Failed to delete issue even with force mode: ${forceDeleteError.message}`);
            }
          } else {
            throw new Error(issueError.message || 'Failed to delete issue');
          }
        }
        
        return { success: true, message: 'Issue deleted successfully', issueId };
      } catch (error: any) {
        console.error("Error in deleteIssueMutation:", error);
        throw error;
      } finally {
        setIsDeleteInProgress(false);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success("Issue deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Delete issue error:", error);
      toast.error(`Failed to delete issue: ${error.message}`);
    },
  });

  return { 
    deleteIssueMutation, 
    isDeleteInProgress 
  };
};
