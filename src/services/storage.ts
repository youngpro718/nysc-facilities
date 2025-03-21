
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Service for handling Supabase storage operations
 */
export const storageService = {
  /**
   * Uploads a file to a specified bucket
   * @param bucketName Bucket to upload to
   * @param file File to upload
   * @param options Upload options
   * @returns Public URL of the uploaded file or null if error
   */
  async uploadFile(
    bucketName: string,
    file: File,
    options: {
      path?: string
    } = {}
  ): Promise<string | null> {
    try {
      // Check authentication first
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('User not authenticated for upload');
        toast.error('You must be logged in to upload files');
        return null;
      }
      
      // Generate file path if not provided
      const fileExt = file.name.split('.').pop();
      const filePath = options.path || 
        `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      // Upload the file
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });
        
      if (uploadError) {
        console.error(`Error uploading file to ${bucketName}:`, uploadError);
        throw uploadError;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error) {
      console.error(`Unexpected error uploading file to ${bucketName}:`, error);
      toast.error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  },
  
  /**
   * Removes a file from storage
   * @param bucketName Bucket containing the file
   * @param filePath Path to the file
   * @returns True if successful, false otherwise
   */
  async removeFile(bucketName: string, filePath: string): Promise<boolean> {
    try {
      // Check authentication first
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('User not authenticated for file removal');
        toast.error('You must be logged in to remove files');
        return false;
      }
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
        
      if (error) {
        console.error(`Error removing file from ${bucketName}:`, error);
        toast.error(`Error removing file: ${error.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Unexpected error removing file from ${bucketName}:`, error);
      toast.error(`Failed to remove file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  },
  
  /**
   * Extracts filename from a Supabase Storage URL
   * @param url Supabase storage URL
   * @returns Filename or null if invalid URL
   */
  getFilenameFromUrl(url: string): string | null {
    try {
      // Extract just the filename path from the full URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketPart = pathParts.findIndex(part => part === 'object');
      
      if (bucketPart !== -1 && bucketPart + 2 < pathParts.length) {
        // Return everything after the bucket name in the path
        return pathParts.slice(bucketPart + 2).join('/');
      }
      
      // Fallback to just the last part if we can't extract properly
      return url.split('/').pop() || null;
    } catch {
      return null;
    }
  }
};

/**
 * Initialize storage buckets required by the application
 * This function ensures required storage buckets exist
 * Note: Should only be called after authentication is confirmed
 */
export async function initializeStorage(): Promise<void> {
  try {
    // Check authentication first
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.log('Skipping storage initialization: User not authenticated');
      return;
    }

    // Define the required buckets with hyphens (not underscores)
    const requiredBuckets = ['courtroom-photos'];
    
    // Check and initialize each bucket
    for (const bucketName of requiredBuckets) {
      try {
        // Just check if the bucket exists, no need to create it as it's handled by SQL migrations
        const { data, error } = await supabase.storage.getBucket(bucketName);
        
        if (error && error.message !== 'Bucket not found') {
          console.error(`⚠️ Error checking bucket ${bucketName}:`, error);
        } else if (data || !error) {
          console.log(`✅ Verified bucket exists: ${bucketName}`);
        }
      } catch (error) {
        console.error(`⚠️ Error initializing bucket ${bucketName}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to initialize storage buckets:', error);
  }
}
