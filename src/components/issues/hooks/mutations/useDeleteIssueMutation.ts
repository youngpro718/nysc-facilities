
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import axios from "axios";

/**
 * Hook for deleting issues with proper error handling and loading state
 */
export const useDeleteIssueMutation = () => {
  const queryClient = useQueryClient();
  const [isDeleteInProgress, setIsDeleteInProgress] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ issueId, force = false }: { issueId: string; force?: boolean }) => {
      setIsDeleteInProgress(true);
      console.log(`Deleting issue with ID: ${issueId}${force ? ' (force mode)' : ''}`);
      
      try {
        // Use our API endpoint which handles all the cleanup
        const response = await axios.delete(`/api/issues/delete-issue?issueId=${issueId}${force ? '&force=true' : ''}`);
        console.log("Delete response:", response.data);
        return response.data;
      } catch (error: any) {
        console.error("Error in deleteIssueMutation:", error);
        
        // If it's a network error (API endpoint not accessible)
        if (error.code === 'ERR_NETWORK') {
          throw new Error("Network error. Please check your connection and try again.");
        }
        
        // If the API returned an error message
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        // Default error message
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
    deleteIssueMutation: mutation,
    isDeleteInProgress 
  };
};
