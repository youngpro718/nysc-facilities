
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
        
        // Create bucket if it doesn't exist
        await this.ensureBucketExists(bucketName);
        
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
        
        // Ensure bucket exists
        await this.ensureBucketExists(bucketName);
        
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
   * Checks if a bucket exists and creates it if it doesn't
   * This is the main method to verify bucket existence
   * @param bucketName Name of the bucket to check/create
   * @returns True if bucket exists or was created, false otherwise
   */
  async ensureBucketExists(bucketName: string): Promise<boolean> {
    try {
      console.log(`Checking if bucket ${bucketName} exists...`);
      
      // First refresh the session to ensure we have valid tokens
      await this.refreshSessionIfNeeded();
      
      // Check if bucket exists
      const { data, error } = await supabase.storage.getBucket(bucketName);
      
      if (error) {
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          console.log(`Bucket ${bucketName} does not exist, creating it...`);
          
          // Create the bucket
          const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true
          });
          
          if (createError) {
            console.error(`Error creating bucket: ${createError.message}`, createError);
            return false;
          }
          
          console.log(`Bucket ${bucketName} created successfully`);
          return true;
        }
        
        console.error(`Error checking bucket existence: ${error.message}`, error);
        return false;
      }
      
      console.log(`Bucket ${bucketName} exists`);
      return true;
    } catch (error) {
      console.error(`Exception checking/creating bucket ${bucketName}:`, error);
      return false;
    }
  },

  /**
   * Alias for ensureBucketExists for compatibility with components using checkBucketExists
   * @param bucketName Name of the bucket to check/create
   * @returns True if bucket exists or was created, false otherwise
   */
  async checkBucketExists(bucketName: string): Promise<boolean> {
    return this.ensureBucketExists(bucketName);
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
   * Initialize storage buckets required by the application
   */
  async initializeStorage(): Promise<void> {
    try {
      // Make sure we have a valid session first
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        console.log('Skipping storage initialization: No active session');
        return;
      }
      
      // Create the courtroom-photos bucket if it doesn't exist
      await this.ensureBucketExists('courtroom-photos');
      
      console.log('Storage initialization complete');
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }
};

/**
 * Initialize storage buckets required by the application
 * Note: Should only be called after authentication is confirmed
 */
export async function initializeStorage(): Promise<void> {
  try {
    await storageService.initializeStorage();
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}
