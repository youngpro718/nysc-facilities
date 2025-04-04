
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { issueId, force } = req.query;

    if (!issueId) {
      return res.status(400).json({ message: 'Issue ID is required' });
    }

    // Delete the issue from the database
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId);

    if (error) {
      console.error('Error deleting issue:', error);
      
      // If force is true, we might want to implement additional cleanup logic here
      if (force === 'true') {
        // Additional cleanup logic could be added here
        console.log('Force delete requested, attempting alternative deletion method');
      }
      
      return res.status(500).json({ 
        message: 'Failed to delete issue',
        error: error.message
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Issue deleted successfully' 
    });
  } catch (error) {
    console.error('Unexpected error in delete-issue API:', error);
    return res.status(500).json({ 
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
