import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for direct issue deletion with force option and advanced error handling
 */
export const useIssueDirectDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Deletes an issue by ID with optional force flag to bypass constraints
   * @param issueId The ID of the issue to delete
   * @param force Whether to try to force the deletion by bypassing constraints
   * @returns Promise<boolean> indicating success or failure
   */
  const deleteIssue = async (issueId: string, force: boolean = false) => {
    if (!issueId) {
      toast.error('No issue ID provided');
      return false;
    }

    setIsDeleting(true);
    console.log(`Directly deleting issue with ID: ${issueId}${force ? ' (with force)' : ''}`);

    try {
      const response = await axios.delete(
        `/api/issues/delete-issue?issueId=${issueId}${force ? '&force=true' : ''}`
      );

      console.log('Delete response:', response.data);

      if (response.data.success) {
        // Invalidate all relevant queries
        queryClient.invalidateQueries({ queryKey: ['issues'] });
        queryClient.invalidateQueries({ queryKey: ['userIssues'] });

        toast.success(response.data.message || 'Issue deleted successfully');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete issue');
      }
    } catch (error: any) {
      console.error('Error in deleteIssue:', error);

      // Create a custom error object with additional properties
      const enhancedError: any = new Error(
        error.response?.data?.message || error.message || 'Failed to delete issue'
      );

      // Add additional properties from the response
      if (error.response?.data) {
        enhancedError.requiresForce = error.response.data.requiresForce;
        enhancedError.response = error.response;
      }

      // Handle different error types for toast messages
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.response?.status === 404) {
        toast.error('Issue not found. It may have already been deleted.');
      } else if (error.response?.status === 409 || error.response?.data?.requiresForce) {
        toast.error('Cannot delete due to related records. Try using force delete.');
      } else if (error.response?.data?.message) {
        toast.error(`Failed to delete issue: ${error.response.data.message}`);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete issue. Please try again later.');
      }

      // Throw the enhanced error for the component to handle
      throw enhancedError;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteIssue,
    isDeleting
  };
};