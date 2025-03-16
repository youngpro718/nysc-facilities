
import { supabase } from "./client";

/**
 * Initialize the required storage buckets for the application
 * @returns Promise resolving to success status
 */
export async function initializeStorageBuckets() {
  try {
    // Create an array of buckets we need to ensure exist
    const requiredBuckets = [
      {
        name: 'courtroom-photos',
        isPublic: true,
        fileSizeLimit: 10485760 // 10MB
      }
    ];
    
    // Get current buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError };
    }
    
    // Create missing buckets
    for (const bucket of requiredBuckets) {
      const bucketExists = existingBuckets?.some(b => b.name === bucket.name);
      
      if (!bucketExists) {
        console.log(`Creating storage bucket: ${bucket.name}`);
        const { error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.isPublic,
          fileSizeLimit: bucket.fileSizeLimit
        });
        
        if (error && error.message !== 'Duplicate name') {
          console.error(`Error creating bucket ${bucket.name}:`, error);
          // Continue with other buckets even if one fails
        } else {
          console.log(`Successfully created bucket: ${bucket.name}`);
        }
      } else {
        console.log(`Bucket already exists: ${bucket.name}`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in initializeStorageBuckets:', error);
    return { success: false, error };
  }
}

/**
 * Check if a bucket exists
 * @param bucketName The name of the bucket to check
 * @returns Promise resolving to boolean indicating if bucket exists
 */
export async function checkBucketExists(bucketName: string): Promise<boolean> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking if bucket exists:', error);
      return false;
    }
    
    return buckets?.some(bucket => bucket.name === bucketName) || false;
  } catch (error) {
    console.error('Error in checkBucketExists:', error);
    return false;
  }
}

/**
 * Upload a file to Supabase storage
 * @param bucketName The storage bucket name
 * @param filePath The path where the file will be stored
 * @param file The file to upload
 * @returns Promise with upload result
 */
export async function uploadFile(bucketName: string, filePath: string, file: File) {
  try {
    // First ensure bucket exists
    const bucketExists = await checkBucketExists(bucketName);
    
    if (!bucketExists) {
      console.warn(`Bucket ${bucketName} doesn't exist. Attempting to create it.`);
      await initializeStorageBuckets();
    }
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });
      
    if (error) {
      console.error(`Error uploading file to ${bucketName}:`, error);
      throw error;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    return { data, publicUrl };
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
}

/**
 * Remove a file from storage
 * @param bucketName The storage bucket name
 * @param filePath The path of the file to remove
 * @returns Promise with removal result
 */
export async function removeFile(bucketName: string, filePath: string) {
  try {
    return await supabase.storage
      .from(bucketName)
      .remove([filePath]);
  } catch (error) {
    console.error(`Error removing file from ${bucketName}:`, error);
    throw error;
  }
}
