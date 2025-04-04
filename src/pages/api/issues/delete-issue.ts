
import { supabase } from '@/integrations/supabase/client';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API handler for deleting an issue and its related records
 * 
 * @param req - NextApiRequest with query parameters
 * @param res - NextApiResponse to send the result
 * 
 * Query parameters:
 * - issueId: Required - The ID of the issue to delete
 * - force: Optional - If 'true', will attempt to forcefully delete even with constraints
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use DELETE.' 
    });
  }

  try {
    const { issueId, force } = req.query;

    // Validate issueId parameter
    if (!issueId || typeof issueId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing or invalid issueId parameter' 
      });
    }

    const forceDelete = force === 'true';
    console.log(`Deleting issue ${issueId}${forceDelete ? ' with force mode' : ''}`);

    // Begin transaction with consistent approach
    // First, fetch the issue to confirm it exists
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .single();

    if (issueError || !issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
        error: issueError?.message
      });
    }

    // Attempt the sequential deletion approach
    // Step 1: Delete related comments
    const { error: commentsDeleteError } = await supabase
      .from('issue_comments')
      .delete()
      .eq('issue_id', issueId);

    if (commentsDeleteError && !forceDelete) {
      console.error('Error deleting comments:', commentsDeleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete related comments',
        error: commentsDeleteError.message
      });
    }

    // Step 2: Delete related history records
    const { error: historyDeleteError } = await supabase
      .from('issue_history')
      .delete()
      .eq('issue_id', issueId);

    if (historyDeleteError && !forceDelete) {
      console.error('Error deleting history:', historyDeleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete related history records',
        error: historyDeleteError.message
      });
    }

    // Step 3: Delete the issue itself
    const { error: issueDeleteError } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId);

    if (issueDeleteError) {
      console.error('Error deleting issue:', issueDeleteError);
      
      if (forceDelete) {
        // In force mode, try using the safer alternative endpoint
        try {
          console.log('Force deleting issue with constraints, trying alternative approach');
          const response = await fetch(`/api/issues/safely-delete-issue?issueId=${issueId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
          }
          
          const safeDeleteResult = await response.json();
          return res.status(200).json(safeDeleteResult);
        } catch (safeDeleteError: any) {
          console.error('Safe delete approach failed:', safeDeleteError);
          return res.status(500).json({
            success: false,
            message: 'Failed to delete issue even with safe approach',
            error: safeDeleteError.message
          });
        }
      } else {
        // Regular error, not in force mode
        return res.status(500).json({
          success: false,
          message: 'Failed to delete issue due to database constraints',
          error: issueDeleteError.message,
          code: issueDeleteError.code,
          details: issueDeleteError.details,
          hint: 'You may need to use force=true if there are referential constraints'
        });
      }
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Issue and related records deleted successfully',
      issueId
    });
  } catch (error: any) {
    // Handle any other errors outside the transaction
    console.error('Error in delete-issue handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
