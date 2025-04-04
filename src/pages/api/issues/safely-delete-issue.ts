
import { supabase } from '@/integrations/supabase/client';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Alternative API handler for safely deleting an issue and all its references
 * when the standard deletion path fails due to constraints
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
    const { issueId } = req.query;

    if (!issueId || typeof issueId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing or invalid issueId parameter' 
      });
    }

    console.log(`Safe deletion for issue ${issueId} - removing all references`);

    // 1. Delete comments
    const { error: commentsError } = await supabase
      .from('issue_comments')
      .delete()
      .eq('issue_id', issueId);
    
    if (commentsError) {
      console.log('Warning: Error removing issue comments:', commentsError);
    }

    // 2. Delete history entries
    const { error: historyError } = await supabase
      .from('issue_history')
      .delete()
      .eq('issue_id', issueId);
    
    if (historyError) {
      console.log('Warning: Error removing issue history:', historyError);
    }

    // 3. Delete any attachments or references in other tables
    // Add more deletions here if needed...

    // 4. Finally delete the issue
    const { error: issueError } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId);

    if (issueError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete issue after cleaning references',
        error: issueError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Issue safely deleted with all references',
      issueId
    });
  } catch (error: any) {
    console.error('Error in safe deletion handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during safe deletion',
      error: error.message
    });
  }
}
