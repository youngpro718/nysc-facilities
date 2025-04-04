
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

// Helper function to get photos from an issue
const getIssuePhotos = async (issueId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('issues')
    .select('photos')
    .eq('id', issueId)
    .single();
  
  if (error || !data) return [];
  return data.photos || [];
};

// Helper function to delete attachments from storage
const deletePhotoAttachments = async (photos: string[]) => {
  if (!photos.length) return;
  
  // Extract file paths from URLs if needed
  const filePaths = photos.map(photo => {
    const match = photo.match(/\/([^/]+)$/);
    return match ? match[1] : photo;
  });
  
  await supabase
    .storage
    .from('issue-attachments')
    .remove(filePaths);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Issue ID is required' });
  }

  try {
    // Get issue photos before deleting the issue
    const photos = await getIssuePhotos(id);
    
    // Delete the issue
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Clean up photos in storage
    if (photos && photos.length > 0) {
      await deletePhotoAttachments(photos);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return res.status(500).json({ error: 'Failed to delete issue' });
  }
}
