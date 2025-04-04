
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

    // Begin a transaction for the delete operation
    const { error: transactionError } = await supabase.rpc('begin');
    if (transactionError) {
      console.error('Transaction begin error:', transactionError);
      return res.status(500).json({
        success: false,
        message: 'Failed to start transaction',
        error: transactionError.message
      });
    }

    try {
      // Step 1: Delete related comments first
      const { error: commentsDeleteError } = await supabase
        .from('issue_comments')
        .delete()
        .eq('issue_id', issueId);

      if (commentsDeleteError && !forceDelete) {
        await supabase.rpc('rollback');
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
        await supabase.rpc('rollback');
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
        await supabase.rpc('rollback');
        console.error('Error deleting issue:', issueDeleteError);
        
        if (issueDeleteError.code === '23503' && forceDelete) {
          // If foreign key constraint violation in force mode, try different approach
          console.log('Force deleting issue with constraints, bypassing transaction');
          
          // Attempt a direct delete with cascade option (if supported)
          const { error: forceDeleteError } = await supabase
            .from('issues')
            .delete()
            .eq('id', issueId)
            .select();
            
          if (forceDeleteError) {
            console.error('Force delete error:', forceDeleteError);
            return res.status(500).json({
              success: false,
              message: 'Failed to delete issue even in force mode',
              error: forceDeleteError.message
            });
          }
        } else {
          // Regular error, not in force mode or not a constraint issue
          return res.status(500).json({
            success: false,
            message: 'Failed to delete issue',
            error: issueDeleteError.message,
            code: issueDeleteError.code,
            details: issueDeleteError.details,
            hint: 'You may need to use force=true if there are referential constraints'
          });
        }
      }

      // Commit the transaction if we've reached this point
      await supabase.rpc('commit');

      // Return success
      return res.status(200).json({
        success: true,
        message: 'Issue and related records deleted successfully',
        issueId
      });
    } catch (error: any) {
      // Rollback transaction on any unexpected error
      await supabase.rpc('rollback');
      console.error('Unexpected error during delete transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
        error: error.message
      });
    }
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
