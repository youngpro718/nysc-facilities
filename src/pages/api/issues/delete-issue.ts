
import { supabase } from "@/integrations/supabase/client";

/**
 * API handler for deleting an issue
 * Supports force deletion by passing force=true query parameter
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { issueId } = req.query;
  const forceDelete = req.query.force === 'true';

  if (!issueId) {
    return res.status(400).json({ success: false, message: 'Issue ID is required' });
  }

  try {
    // Ensure issueId is a string (not an array)
    const id = Array.isArray(issueId) ? issueId[0] : issueId;
    
    // If force delete is enabled, we'll delete all related records first
    if (forceDelete) {
      // Delete any related comments
      await supabase.from('issue_comments').delete().eq('issue_id', id);
      
      // Delete any related history/timeline entries
      await supabase.from('issue_history').delete().eq('issue_id', id);
      
      // Delete any related attachments or media
      await supabase.from('issue_attachments').delete().eq('issue_id', id);
    }

    // Delete the issue
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', id);

    if (error) {
      // Check for foreign key constraint violations
      if (error.code === '23503') {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete issue because it has related records',
          requiresForce: true,
          error
        });
      }

      // Generic error handler
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete issue',
        error
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in delete-issue API:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error
    });
  }
}
