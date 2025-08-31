
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Service for handling courtroom photo operations
 */
export const courtroomPhotoService = {
  /**
   * Clears all photos for a courtroom in both database and storage
   * @param roomId ID of the room to clear photos for
   * @returns Object with success status and details
   */
  async clearPhotos(roomId: string): Promise<{ 
    success: boolean; 
    message: string;
    filesDeleted: number;
    errors: string[];
  }> {
    try {
      console.log(`Clearing courtroom photos for room: ${roomId}`);
      
      // First, get the current room data to find photo URLs
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('courtroom_photos')
        .eq('id', roomId)
        .single();
        
      if (roomError) {
        console.error('Error fetching room data:', roomError);
        return {
          success: false,
          message: `Failed to fetch room data: ${roomError.message}`,
          filesDeleted: 0,
          errors: [roomError.message]
        };
      }
      
      const photos = room?.courtroom_photos;
      if (!photos) {
        // No photos to clear
        return {
          success: true,
          message: 'No photos to clear',
          filesDeleted: 0,
          errors: []
        };
      }
      
      const filesToDelete = [];
      const errors = [];
      
      // Parse URLs to get file paths
      if (photos && typeof photos === 'object' && 'judge_view' in photos && photos.judge_view) {
        try {
          const judgeUrl = new URL(photos.judge_view as string);
          const pathParts = judgeUrl.pathname.split('/');
          const objectIndex = pathParts.indexOf('object');
          const publicIndex = pathParts.indexOf('public');
          
          if (objectIndex !== -1 && publicIndex !== -1 && publicIndex > objectIndex) {
            const bucketName = pathParts[publicIndex + 1];
            const filePath = pathParts.slice(publicIndex + 2).join('/');
            
            console.log(`Found judge view photo in bucket ${bucketName}, path: ${filePath}`);
            filesToDelete.push({ bucketName, filePath });
          }
        } catch (e) {
          console.error('Error parsing judge view URL:', e);
          errors.push(`Failed to parse judge view URL`);
        }
      }
      
      if (photos && typeof photos === 'object' && 'audience_view' in photos && photos.audience_view) {
        try {
          const audienceUrl = new URL(photos.audience_view as string);
          const pathParts = audienceUrl.pathname.split('/');
          const objectIndex = pathParts.indexOf('object');
          const publicIndex = pathParts.indexOf('public');
          
          if (objectIndex !== -1 && publicIndex !== -1 && publicIndex > objectIndex) {
            const bucketName = pathParts[publicIndex + 1];
            const filePath = pathParts.slice(publicIndex + 2).join('/');
            
            console.log(`Found audience view photo in bucket ${bucketName}, path: ${filePath}`);
            filesToDelete.push({ bucketName, filePath });
          }
        } catch (e) {
          console.error('Error parsing audience view URL:', e);
          errors.push(`Failed to parse audience view URL`);
        }
      }
      
      // Delete files from storage
      let filesDeleted = 0;
      for (const file of filesToDelete) {
        try {
          const { error: deleteError } = await supabase.storage
            .from(file.bucketName)
            .remove([file.filePath]);
            
          if (deleteError) {
            console.error(`Error deleting file ${file.filePath}:`, deleteError);
            errors.push(`Failed to delete file ${file.filePath}: ${deleteError.message}`);
          } else {
            filesDeleted++;
          }
        } catch (e: any) {
          console.error(`Error in storage deletion:`, e);
          errors.push(`Unexpected error deleting file: ${e.message}`);
        }
      }
      
      // Update database to remove photo references
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ courtroom_photos: { judge_view: null, audience_view: null } })
        .eq('id', roomId);
        
      if (updateError) {
        console.error('Error updating room data:', updateError);
        errors.push(`Failed to update room data: ${updateError.message}`);
        return {
          success: false,
          message: `Failed to update room data: ${updateError.message}`,
          filesDeleted,
          errors
        };
      }
      
      return {
        success: true,
        message: `Successfully cleared ${filesDeleted} photo(s) for room ${roomId}`,
        filesDeleted,
        errors
      };
    } catch (error: any) {
      console.error('Error clearing photos:', error);
      return {
        success: false,
        message: `Unexpected error: ${error.message || 'Unknown error'}`,
        filesDeleted: 0,
        errors: [error.message || 'Unknown error']
      };
    }
  }
};
