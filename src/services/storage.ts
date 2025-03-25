import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Maximum number of retries for storage operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Service for handling Supabase storage operations
 */
export const storageService = {
  /**
   * Uploads a file to a specified bucket with retry logic
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
    // Try the operation with retries
    return this.withRetries(async () => {
      try {
        // Check authentication first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Authentication error: ' + sessionError.message);
        }
        
        if (!session) {
          console.error('User not authenticated for upload');
          throw new Error('You must be logged in to upload files');
        }
        
        // Verify bucket exists before attempting upload
        const bucketExists = await this.checkBucketExists(bucketName);
        if (!bucketExists) {
          throw new Error(`Storage bucket '${bucketName}' does not exist. Please contact your administrator.`);
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
        console.error(`Error uploading file to ${bucketName}:`, error);
        throw error; // Rethrow for retry handling
      }
    });
  },
  
  /**
   * Removes a file from storage with retry logic
   * @param bucketName Bucket containing the file
   * @param filePath Path to the file
   * @returns True if successful, false otherwise
   */
  async removeFile(bucketName: string, filePath: string): Promise<boolean> {
    // Try the operation with retries
    return this.withRetries(async () => {
      try {
        // Check authentication first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Authentication error: ' + sessionError.message);
        }
        
        if (!session) {
          console.error('User not authenticated for file removal');
          throw new Error('You must be logged in to remove files');
        }
        
        // Verify bucket exists before attempting removal
        const bucketExists = await this.checkBucketExists(bucketName);
        if (!bucketExists) {
          throw new Error(`Storage bucket '${bucketName}' does not exist. Please contact your administrator.`);
        }
        
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([filePath]);
          
        if (error) {
          console.error(`Error removing file from ${bucketName}:`, error);
          throw error;
        }
        
        return true;
      } catch (error) {
        console.error(`Error removing file from ${bucketName}:`, error);
        throw error; // Rethrow for retry handling
      }
    }, false); // false = return false on failure after retries
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
   * Checks if a bucket exists with retry logic
   * @param bucketName Name of the bucket to check
   * @returns True if bucket exists, false otherwise
   */
  async checkBucketExists(bucketName: string): Promise<boolean> {
    return this.withRetries(async () => {
      try {
        console.log(`Checking if bucket ${bucketName} exists...`);
        
        // First refresh the session to ensure we have valid tokens
        await this.refreshSessionIfNeeded();
        
        const { data, error } = await supabase.storage.getBucket(bucketName);
        
        if (error) {
          if (error.message.includes('unauthorized') || error.message.includes('JWT')) {
            console.warn('Authorization error checking bucket, attempting session refresh');
            await this.forceRefreshSession();
            // Retry after refresh
            const { data: retryData, error: retryError } = await supabase.storage.getBucket(bucketName);
            if (retryError) {
              console.error(`Error checking bucket after refresh: ${retryError.message}`, retryError);
              throw retryError;
            }
            return !!retryData;
          }
          
          console.error(`Error checking bucket existence: ${error.message}`, error);
          throw error;
        }
        
        console.log(`Bucket check result:`, data);
        return !!data;
      } catch (error) {
        console.error(`Exception checking if bucket ${bucketName} exists:`, error);
        throw error; // Rethrow for retry handling
      }
    }, false); // false = return false on failure after retries
  },

  /**
   * Helper to refresh session if it might be expired
   */
  async refreshSessionIfNeeded(): Promise<void> {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Check if token might expire soon (within 5 minutes)
        const expiresAt = data.session.expires_at;
        if (expiresAt) {
          const expiresAtDate = new Date(expiresAt * 1000);
          const now = new Date();
          const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
          
          if (expiresAtDate < fiveMinutesFromNow) {
            console.log('Session token expiring soon, refreshing...');
            await this.forceRefreshSession();
          }
        }
      } else {
        console.warn('No active session found when checking for refresh');
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  },
  
  /**
   * Force a session refresh
   */
  async forceRefreshSession(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
      } else {
        console.log('Session refreshed successfully');
      }
    } catch (error) {
      console.error('Exception refreshing session:', error);
    }
  },
  
  /**
   * Generic retry wrapper for storage operations
   * @param operation Function to retry
   * @param throwOnFailure Whether to throw or return defaultValue on ultimate failure
   * @param defaultValue Value to return on failure if not throwing
   * @returns Result of operation or defaultValue
   */
  async withRetries<T>(
    operation: () => Promise<T>, 
    throwOnFailure: boolean = true,
    defaultValue?: T
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.error(`Operation failed (attempt ${attempt}/${MAX_RETRIES}):`, error);
        
        if (attempt < MAX_RETRIES) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          console.log(`Retrying operation (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        }
      }
    }
    
    // If we get here, all retries failed
    if (throwOnFailure) {
      const errorMessage = lastError instanceof Error ? lastError.message : 'Operation failed after multiple attempts';
      toast.error(errorMessage);
      throw lastError;
    }
    
    // Return default value if we're not throwing
    return defaultValue as T;
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
  }
};

/**
 * Initialize storage buckets required by the application
 * This function verifies required storage buckets exist
 * Note: Should only be called after authentication is confirmed
 */
export async function initializeStorage(): Promise<void> {
  try {
    // Make sure we have a valid session first
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      console.log('Skipping storage initialization: No active session');
      return;
    }
    
    // Verify the courtroom-photos bucket exists
    const exists = await storageService.checkBucketExists('courtroom-photos');
    console.log(`Storage initialization - courtroom-photos bucket exists: ${exists}`);
    
    if (!exists) {
      console.warn('⚠️ courtroom-photos bucket does not exist! This will cause upload failures.');
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}
