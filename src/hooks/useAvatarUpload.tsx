import { useState, useRef } from 'react';
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseAvatarUploadOptions {
  onSuccess?: (avatarUrl: string) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export function useAvatarUpload({
  onSuccess,
  onError,
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}: UseAvatarUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      const error = `Invalid file type. Please select: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`;
      toast.error(error);
      onError?.(error);
      return false;
    }

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      const error = `File too large. Maximum size is ${maxSizeMB}MB`;
      toast.error(error);
      onError?.(error);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (file: File, userId?: string): Promise<string | null> => {
    try {
      setUploading(true);

      // Get user if not provided
      if (!userId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Not authenticated');
        userId = user.id;
      }

      if (!validateFile(file)) return null;

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast.success('Avatar uploaded successfully!');
      onSuccess?.(publicUrl);
      return publicUrl;

    } catch (error) {
      const errorMessage = getErrorMessage(error) || 'Failed to upload avatar';
      logger.error('Avatar upload error:', error);
      toast.error(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const resetPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return {
    uploading,
    previewUrl,
    fileInputRef,
    handleFileSelect,
    uploadAvatar,
    resetPreview,
    openFileDialog,
    validateFile
  };
}
