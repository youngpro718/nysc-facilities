
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
      console.log(`Attempting to delete issue with ID: ${issueId}${force ? ' (force mode)' : ''}`);
      
      try {
        // First delete comments to avoid foreign key constraint issues
        console.log('Step 1: Deleting comments for issue:', issueId);
        const { error: commentsError } = await supabase
          .from('issue_comments')
          .delete()
          .eq('issue_id', issueId);
          
        if (commentsError) {
          console.warn('Error deleting comments:', commentsError);
          if (!force) throw new Error(`Failed to delete comments: ${commentsError.message}`);
        }

        // Then delete history entries
        console.log('Step 2: Deleting history entries for issue:', issueId);
        const { error: historyError } = await supabase
          .from('issue_history')
          .delete()
          .eq('issue_id', issueId);
          
        if (historyError) {
          console.warn('Error deleting history:', historyError);
          if (!force) throw new Error(`Failed to delete history: ${historyError.message}`);
        }

        // Finally delete the issue itself
        console.log('Step 3: Deleting issue:', issueId);
        const { error: issueError } = await supabase
          .from('issues')
          .delete()
          .eq('id', issueId);
          
        if (issueError) {
          console.error('Error deleting issue:', issueError);
          
          if (force) {
            // If force is true, we'll try a different approach
            console.log('Attempting force delete approach...');
            
            // This is a more aggressive approach that might help in case of complex DB constraints
            // We'll try updating the issue to mark it as deleted, then retry the deletion
            const { error: updateError } = await supabase
              .from('issues')
              .update({ status: 'deleted' })
              .eq('id', issueId);
              
            if (updateError) {
              console.error('Force update failed:', updateError);
              throw new Error(`Failed to delete issue even with force mode: ${issueError.message}`);
            }
            
            // Try deletion again after marking as deleted
            const { error: secondDeleteError } = await supabase
              .from('issues')
              .delete()
              .eq('id', issueId);
              
            if (secondDeleteError) {
              console.error('Second delete attempt failed:', secondDeleteError);
              throw new Error(`Failed to delete issue even with force mode: ${secondDeleteError.message}`);
            }
          } else {
            throw new Error(issueError.message || 'Failed to delete issue');
          }
        }
        
        console.log('Issue successfully deleted:', issueId);
        return { success: true, message: 'Issue deleted successfully', issueId };
      } catch (error: any) {
        console.error("Error in deleteIssueMutation:", error);
        throw error;
      } finally {
        setIsDeleteInProgress(false);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch multiple related queries
      console.log('Invalidating queries after successful deletion');
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      
      // Also invalidate any query that might include the specific issue
      queryClient.invalidateQueries({ queryKey: ['issue', data.issueId] });
      
      // Clear the item from the cache immediately
      queryClient.setQueryData(['issues'], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((issue: any) => issue.id !== data.issueId)
        };
      });
      
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
