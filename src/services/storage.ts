import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Service for handling Supabase storage operations
 */
export const storageService = {
  /**
   * Uploads a file to a specified bucket
   * @param bucketName Bucket to upload to
   * @param file File to upload
   * @param options Upload options including path and metadata
   * @returns Public URL of the uploaded file or null if error
   */
  async uploadFile(
    bucketName: string,
    file: File,
    options: {
      path?: string;
      metadata?: Record<string, any>;
      entityId?: string; // Entity ID (like room ID) for structured storage
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
      
      // Verify bucket exists before attempting upload
      let bucketExists = await this.checkBucketExists(bucketName);
      
      // If bucket doesn't exist, try to create it
      if (!bucketExists) {
        try {
          console.log(`Attempting to create bucket: ${bucketName}`);
          const { error } = await supabase.storage.createBucket(bucketName, {
            public: true,  // Make it public to allow direct access to files
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (!error) {
            console.log(`Successfully created bucket: ${bucketName}`);
            bucketExists = true;
          } else {
            console.error(`Failed to create bucket ${bucketName}:`, error);
            toast.error(`Storage bucket '${bucketName}' could not be created. Please contact your administrator.`);
            return null;
          }
        } catch (createError) {
          console.error(`Error creating bucket ${bucketName}:`, createError);
          toast.error(`Failed to create storage bucket. Please contact your administrator.`);
          return null;
        }
      }
      
      // Generate structured file path if not provided
      const fileExt = file.name.split('.').pop();
      
      let filePath = options.path;
      if (!filePath) {
        // Create structured paths to organize files
        if (options.entityId) {
          // If entityId is provided, structure files by entity (e.g., rooms/[roomId]/...)
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const entityType = bucketName === 'courtroom-photos' ? 'rooms' : 'entities';
          filePath = `${entityType}/${options.entityId}/${fileName}`;
        } else {
          // Default fallback behavior
          filePath = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        }
      }
      
      console.log(`Uploading file to ${bucketName} at path: ${filePath}`);
      
      // Upload the file
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
          ...(options.metadata ? { cacheControl: '3600', metadata: options.metadata } : {})
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
      
      // Verify bucket exists before attempting removal
      const bucketExists = await this.checkBucketExists(bucketName);
      if (!bucketExists) {
        const errorMessage = `Storage bucket '${bucketName}' does not exist. Please contact your administrator.`;
        console.error(errorMessage);
        toast.error(errorMessage);
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
   * Lists files in a specific path of a bucket
   * @param bucketName Bucket to list files from
   * @param path Path within the bucket
   * @returns Array of file objects or null if error
   */
  async listFiles(bucketName: string, path: string = ''): Promise<any[] | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(path);
      
      if (error) {
        console.error(`Error listing files in ${bucketName}/${path}:`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error(`Unexpected error listing files in ${bucketName}/${path}:`, error);
      return null;
    }
  },
  
  /**
   * Gets files for a specific entity (e.g., room)
   * @param bucketName Bucket to search in
   * @param entityId ID of the entity (e.g., room ID)
   * @returns Array of file URLs or null if error
   */
  async getEntityFiles(bucketName: string, entityId: string): Promise<string[] | null> {
    try {
      // Determine the path prefix for this entity
      const entityType = bucketName === 'courtroom-photos' ? 'rooms' : 'entities';
      const path = `${entityType}/${entityId}`;
      
      // List files in the entity's directory
      const files = await this.listFiles(bucketName, path);
      
      if (!files) return null;
      
      // Convert file objects to public URLs
      return files
        .filter(file => !file.id.endsWith('/')) // Filter out folders
        .map(file => {
          const filePath = `${path}/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          return publicUrl;
        });
    } catch (error) {
      console.error(`Error getting entity files for ${entityId} in ${bucketName}:`, error);
      return null;
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
  },

  /**
   * Checks if a bucket exists
   * @param bucketName Name of the bucket to check
   * @returns True if bucket exists, false otherwise
   */
  async checkBucketExists(bucketName: string): Promise<boolean> {
    try {
      console.log(`Checking if bucket ${bucketName} exists...`);
      
      // Use listBuckets instead of getBucket to avoid permission issues
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error(`Error listing buckets: ${error.message}`, error);
        return false;
      }
      
      // Check if the bucket exists in the list
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName) || false;
      console.log(`Bucket '${bucketName}' exists: ${bucketExists}`);
      return bucketExists;
    } catch (error) {
      console.error(`Exception checking if bucket ${bucketName} exists:`, error);
      return false;
    }
  },

  /**
   * Ensures required storage buckets exist - for direct use in components
   * Note: This is now just a verification step as buckets should be created via SQL
   */
  async ensureBucketsExist(bucketNames: string[]): Promise<void> {
    try {
      // Check authentication first
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.log('Skipping bucket verification: User not authenticated');
        return;
      }
      
      for (const bucketName of bucketNames) {
        const exists = await this.checkBucketExists(bucketName);
        
        if (exists) {
          console.log(`✅ Verified bucket exists: ${bucketName}`);
        } else {
          console.warn(`⚠️ Storage bucket not found: ${bucketName}`);
          // We don't try to create it as it should be created via SQL
        }
      }
    } catch (error) {
      console.error('Failed to verify storage buckets:', error);
    }
  },
  
  /**
   * Cleans up orphaned files for an entity
   * @param bucketName Bucket containing the files
   * @param entityId ID of the entity (e.g., room ID)
   * @param validUrls Array of URLs that should be kept
   * @returns Number of files cleaned up or -1 if error
   */
  async cleanupOrphanedFiles(bucketName: string, entityId: string, validUrls: string[]): Promise<number> {
    try {
      // Determine the path prefix for this entity
      const entityType = bucketName === 'courtroom-photos' ? 'rooms' : 'entities';
      const path = `${entityType}/${entityId}`;
      
      // List all files for this entity
      const files = await this.listFiles(bucketName, path);
      
      if (!files) return -1;
      
      // Convert valid URLs to filenames
      const validFilenames = validUrls
        .map(url => this.getFilenameFromUrl(url))
        .filter(filename => filename !== null) as string[];
      
      // Find files that aren't in the valid list
      const filesToDelete = files
        .filter(file => !file.id.endsWith('/')) // Filter out folders
        .filter(file => {
          const filePath = `${path}/${file.name}`;
          return !validFilenames.some(validFile => validFile.includes(filePath));
        })
        .map(file => `${path}/${file.name}`);
      
      if (filesToDelete.length === 0) {
        return 0;
      }
      
      // Delete orphaned files
      const { error } = await supabase.storage
        .from(bucketName)
        .remove(filesToDelete);
        
      if (error) {
        console.error(`Error cleaning up orphaned files in ${bucketName}:`, error);
        return -1;
      }
      
      return filesToDelete.length;
    } catch (error) {
      console.error(`Error cleaning up orphaned files for ${entityId} in ${bucketName}:`, error);
      return -1;
    }
  }
};

/**
 * Initialize storage buckets required by the application
 * This function verifies required storage buckets exist
 * Note: Should only be called after authentication is confirmed
 */
export async function initializeStorage(): Promise<void> {
  // Verify required buckets exist
  await storageService.ensureBucketsExist(['courtroom-photos', 'term-pdfs']);
}
