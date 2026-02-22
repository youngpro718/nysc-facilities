import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, AlertTriangle, Eye, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "../../lib/supabase";

interface UploadState {
  file: File | null;
  progress: number;
  isUploading: boolean;
  error: string | null;
  previewUrl: string | null;
  uploadedUrl: string | null;
}

interface MobilePhotoUploadProps {
  label: string;
  entityId: string;
  bucketName: string;
  uploadPath: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  existingUrl?: string | null;
  disabled?: boolean;
  className?: string;
}

export function MobilePhotoUpload({
  label,
  entityId,
  bucketName,
  uploadPath,
  onUploadComplete,
  onRemove,
  existingUrl,
  disabled = false,
  className = ""
}: MobilePhotoUploadProps) {
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadControllerRef = useRef<AbortController | null>(null);
  
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    progress: 0,
    isUploading: false,
    error: null,
    previewUrl: null,
    uploadedUrl: existingUrl || null
  });

  const [isOrientationChanging, setIsOrientationChanging] = useState(false);
  const [sessionKey] = useState(() => `photo_upload_${entityId}_${uploadPath}`);

  // Persist state in sessionStorage
  const persistState = useCallback((state: UploadState) => {
    try {
      const persistData = {
        progress: state.progress,
        isUploading: state.isUploading,
        error: state.error,
        previewUrl: state.previewUrl,
        uploadedUrl: state.uploadedUrl,
        fileMetadata: state.file ? {
          name: state.file.name,
          size: state.file.size,
          type: state.file.type,
          lastModified: state.file.lastModified
        } : null
      };
      sessionStorage.setItem(sessionKey, JSON.stringify(persistData));
    } catch (error) {
      logger.warn('Failed to persist upload state:', error);
    }
  }, [sessionKey]);

  // Restore state from sessionStorage
  const restoreState = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(sessionKey);
      if (stored) {
        const persistData = JSON.parse(stored);
        setUploadState(prev => ({
          ...prev,
          progress: persistData.progress || 0,
          isUploading: persistData.isUploading || false,
          error: persistData.error || null,
          previewUrl: persistData.previewUrl || null,
          uploadedUrl: persistData.uploadedUrl || existingUrl || null
        }));
      }
    } catch (error) {
      logger.warn('Failed to restore upload state:', error);
    }
  }, [sessionKey, existingUrl]);

  // Handle orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsOrientationChanging(true);
      // Persist current state before orientation change
      persistState(uploadState);
      
      // Show warning if upload is in progress
      if (uploadState.isUploading) {
        toast.warning("Upload paused during orientation change");
      }
      
      // Clear orientation flag after a short delay
      setTimeout(() => {
        setIsOrientationChanging(false);
        restoreState();
      }, 100);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && uploadState.isUploading) {
        persistState(uploadState);
      } else if (document.visibilityState === 'visible') {
        restoreState();
      }
    };

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [uploadState, persistState, restoreState]);

  // Initialize state on mount
  useEffect(() => {
    restoreState();
  }, [restoreState]);

  // Update persisted state when uploadState changes
  useEffect(() => {
    persistState(uploadState);
  }, [uploadState, persistState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uploadControllerRef.current) {
        uploadControllerRef.current.abort();
      }
      if (uploadState.previewUrl) {
        URL.revokeObjectURL(uploadState.previewUrl);
      }
    };
  }, [uploadState.previewUrl]);

  const createPreviewUrl = useCallback((file: File) => {
    if (uploadState.previewUrl) {
      URL.revokeObjectURL(uploadState.previewUrl);
    }
    return URL.createObjectURL(file);
  }, [uploadState.previewUrl]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      toast.error("You must be logged in to upload photos");
      return;
    }

    if (!entityId) {
      toast.error("Entity ID is required for uploads. Please save first.");
      return;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size must be less than 10MB");
      return;
    }

    const previewUrl = createPreviewUrl(file);
    
    setUploadState(prev => ({
      ...prev,
      file,
      previewUrl,
      error: null,
      progress: 0
    }));

    // Auto-start upload
    await handleUpload(file);
  }, [isAuthenticated, entityId, createPreviewUrl]);

  const handleUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Create new abort controller for this upload
    uploadControllerRef.current = new AbortController();

    try {
      setUploadState(prev => ({
        ...prev,
        isUploading: true,
        error: null,
        progress: 0
      }));

      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (createError && !createError.message?.includes('row-level security policy')) {
          throw createError;
        }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${uploadPath}/${fileName}`;

      // Upload with progress tracking
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      setUploadState(prev => ({
        ...prev,
        uploadedUrl: publicUrl,
        progress: 100,
        isUploading: false
      }));

      onUploadComplete(publicUrl);
      toast.success(`${label} uploaded successfully`);

      // Clear session storage after successful upload
      sessionStorage.removeItem(sessionKey);

    } catch (error) {
      if (error.name === 'AbortError') {
        toast.info('Upload cancelled');
      } else {
        logger.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setUploadState(prev => ({
          ...prev,
          error: errorMessage,
          isUploading: false
        }));
        toast.error(`Upload failed: ${errorMessage}`);
      }
    }
  }, [bucketName, uploadPath, onUploadComplete, label, sessionKey]);

  const handleRemove = useCallback(async () => {
    if (!uploadState.uploadedUrl) return;

    try {
      // Extract file path from URL
      const urlParts = uploadState.uploadedUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${uploadPath}/${fileName}`;

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      setUploadState(prev => ({
        ...prev,
        uploadedUrl: null,
        file: null,
        previewUrl: null,
        progress: 0,
        error: null
      }));

      onRemove();
      toast.success(`${label} removed successfully`);

      // Clear session storage
      sessionStorage.removeItem(sessionKey);

    } catch (error) {
      logger.error('Remove error:', error);
      toast.error(`Failed to remove ${label.toLowerCase()}`);
    }
  }, [uploadState.uploadedUrl, uploadPath, bucketName, onRemove, label, sessionKey]);

  const handleRetry = useCallback(() => {
    if (uploadState.file) {
      handleUpload(uploadState.file);
    }
  }, [uploadState.file, handleUpload]);

  const currentImageUrl = uploadState.uploadedUrl || existingUrl;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          {label}
          {isOrientationChanging && (
            <RotateCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isAuthenticated && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to upload photos
            </AlertDescription>
          </Alert>
        )}

        {uploadState.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {uploadState.error}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRetry}
                disabled={!uploadState.file}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {currentImageUrl ? (
            <div className="relative w-full h-48 rounded-md overflow-hidden border group">
              <img 
                src={currentImageUrl} 
                alt={label}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  logger.error(`Error loading ${label.toLowerCase()} image:`, currentImageUrl);
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mx-1"
                  onClick={() => window.open(currentImageUrl, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="mx-1"
                  onClick={handleRemove}
                  disabled={!isAuthenticated || disabled}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md cursor-pointer bg-background hover:bg-accent/50 transition-colors ${
              !isAuthenticated || disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploadState.isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 mb-4 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Uploading... {uploadState.progress}%
                    </p>
                    {uploadState.progress > 0 && (
                      <div className="w-32 h-2 bg-secondary rounded-full mt-2">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${uploadState.progress}%` }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload {label.toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max 10MB • JPG, PNG, GIF
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploadState.isUploading || !isAuthenticated || disabled || !entityId}
              />
            </label>
          )}

          {uploadState.previewUrl && !uploadState.uploadedUrl && (
            <div className="relative w-full h-32 rounded-md overflow-hidden border">
              <img 
                src={uploadState.previewUrl} 
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="text-white text-sm font-medium">Preview</span>
              </div>
            </div>
          )}

          {!entityId && (
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please save first before uploading photos
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}