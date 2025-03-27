
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UploadOptions {
  entityId: string;
  bucketName: string;
  category?: string;
  metadata?: Record<string, any>;
}

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserAuthentication = async (): Promise<boolean> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      setError("You must be logged in to upload photos");
      toast.error("You must be logged in to upload photos");
      return false;
    }
    return true;
  };

  const checkBucketExists = async (bucketName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);
      
      if (error) {
        console.error(`Error checking bucket existence: ${error.message}`, error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error(`Exception checking if bucket ${bucketName} exists:`, error);
      return false;
    }
  };

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<string | null> => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Check authentication
      const isAuthenticated = await checkUserAuthentication();
      if (!isAuthenticated) return null;

      // Verify that the entityId exists
      if (!options.entityId) {
        throw new Error("Entity ID is required for uploads");
      }

      // Verify bucket exists 
      const bucketExists = await checkBucketExists(options.bucketName);
      if (!bucketExists) {
        throw new Error(`Storage bucket '${options.bucketName}' does not exist. Please contact your administrator.`);
      }

      // Generate a structured file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      // Create structured paths using entityId and optional category
      const category = options.category || 'default';
      const filePath = `${options.entityId}/${category}/${fileName}`;
      
      console.log(`Uploading file to ${options.bucketName} at path: ${filePath}`);
      
      // Upload the file
      const { data, error: uploadError } = await supabase.storage
        .from(options.bucketName)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
          ...(options.metadata ? { cacheControl: '3600', metadata: options.metadata } : {})
        });
        
      if (uploadError) {
        console.error(`Error uploading file to ${options.bucketName}:`, uploadError);
        throw uploadError;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucketName)
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Upload error:`, error);
      setError(errorMessage);
      toast.error(`Failed to upload file: ${errorMessage}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = async (url: string, bucketName: string): Promise<boolean> => {
    try {
      // Check authentication
      const isAuthenticated = await checkUserAuthentication();
      if (!isAuthenticated) return false;

      // Extract filename from URL
      const pathMatch = url.match(/\/storage\/v1\/object\/public\/([\w-]+)\/(.*)/);
      if (!pathMatch || pathMatch.length < 3) {
        console.error('Could not extract file path from URL:', url);
        return false;
      }
      
      const filePath = pathMatch[2];
      console.log('Removing file from storage:', filePath);
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
      
      if (error) {
        console.error(`Error removing file:`, error);
        toast.error(`Error removing file: ${error.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('File removal error:', error);
      toast.error(`Failed to remove file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  return {
    isUploading,
    error,
    uploadFile,
    removeFile,
    setError
  };
}
