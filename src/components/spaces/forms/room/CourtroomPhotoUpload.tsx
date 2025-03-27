
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { Loader2, Upload, X, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { storageService } from "@/services/storage";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CourtroomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomPhotoUpload({ form }: CourtroomPhotoUploadProps) {
  const { isAuthenticated } = useAuth();
  const [uploading, setUploading] = useState({
    judge: false,
    audience: false
  });
  const [error, setError] = useState<string | null>(null);
  
  const courtroom_photos = form.watch("courtroom_photos");
  const roomId = form.watch("id");

  useEffect(() => {
    if (!isAuthenticated) {
      setError("You must be logged in to upload photos");
    } else {
      setError(null);
    }
  }, [isAuthenticated]);

  // Ensure courtroom_photos is initialized correctly
  useEffect(() => {
    if (!courtroom_photos && roomId) {
      form.setValue("courtroom_photos", { judge_view: null, audience_view: null }, { shouldValidate: true });
    }
  }, [roomId, courtroom_photos, form]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, view: 'judge_view' | 'audience_view') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      toast.error("You must be logged in to upload photos");
      return;
    }

    // Validate room ID exists
    if (!roomId) {
      toast.error("Room ID is required for uploads. Please save the room first.");
      return;
    }

    try {
      setUploading(prev => ({
        ...prev,
        [view === 'judge_view' ? 'judge' : 'audience']: true
      }));
      setError(null);
      
      // The correct bucket name with hyphens
      const BUCKET_NAME = 'courtroom-photos';
      console.log(`Uploading ${view} photo for room ${roomId} to bucket: ${BUCKET_NAME}`);
      
      // Verify the bucket exists first
      const bucketExists = await storageService.checkBucketExists(BUCKET_NAME);
      if (!bucketExists) {
        throw new Error(`Storage bucket '${BUCKET_NAME}' does not exist. Please contact your administrator.`);
      }
      
      // Upload the file with structured path
      const publicUrl = await storageService.uploadFile(BUCKET_NAME, file, {
        entityId: roomId, 
        metadata: { 
          roomId: roomId,
          view: view,
          uploadedAt: new Date().toISOString()
        }
      });

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }
      
      console.log(`File uploaded successfully, public URL: ${publicUrl}`);

      // Create or update the courtroom_photos object with the correct field structure
      const updatedPhotos = {
        ...(courtroom_photos || { judge_view: null, audience_view: null }),
        [view]: publicUrl
      };
      
      form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
      toast.success(`${view === 'judge_view' ? 'Judge view' : 'Audience view'} photo uploaded successfully`);
      
      // Clean up any orphaned files
      try {
        const validUrls = Object.values(updatedPhotos).filter(Boolean) as string[];
        const cleanedCount = await storageService.cleanupOrphanedFiles(BUCKET_NAME, roomId, validUrls);
        
        if (cleanedCount > 0) {
          console.log(`Cleaned up ${cleanedCount} orphaned files for room ${roomId}`);
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
        // Don't throw here - the upload still succeeded
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(prev => ({
        ...prev,
        [view === 'judge_view' ? 'judge' : 'audience']: false
      }));
      
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleRemovePhoto = async (view: 'judge_view' | 'audience_view') => {
    if (!courtroom_photos?.[view]) return;
    
    if (!isAuthenticated) {
      toast.error("You must be logged in to remove photos");
      return;
    }
    
    try {
      const url = courtroom_photos[view] as string;
      console.log('Removing photo with URL:', url);
      
      // Extract filename from URL
      const fileName = storageService.getFilenameFromUrl(url);
      
      if (fileName) {
        console.log('Removing file from storage:', fileName);
        const success = await storageService.removeFile('courtroom-photos', fileName);
        
        if (!success) {
          console.error('Error removing file from storage');
          // Continue anyway, as we're still removing it from the form
        } else {
          console.log('File successfully removed from storage');
        }
      } else {
        console.warn('Could not extract filename from URL:', url);
      }
      
      const updatedPhotos = { ...courtroom_photos, [view]: null };
      console.log('Updated photos after removal:', updatedPhotos);
      form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
      toast.success(`${view === 'judge_view' ? 'Judge view' : 'Audience view'} photo removed`);
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error(`Failed to remove photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewFullSize = (url: string | null) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Courtroom Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAuthenticated && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to upload or remove photos
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="courtroom_photos.judge_view"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Judge View</FormLabel>
                <div className="mt-2">
                  {courtroom_photos?.judge_view ? (
                    <div className="relative w-full h-48 rounded-md overflow-hidden border group">
                      <img 
                        src={courtroom_photos.judge_view as string} 
                        alt="Judge View" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          console.error('Error loading judge view image:', courtroom_photos.judge_view);
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="mx-1"
                          onClick={() => handleViewFullSize(courtroom_photos.judge_view as string)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="mx-1"
                          onClick={() => handleRemovePhoto('judge_view')}
                          disabled={!isAuthenticated}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md cursor-pointer bg-background hover:bg-accent/50 ${!isAuthenticated ? 'opacity-50' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploading.judge ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </span>
                          ) : (
                            <span>Click to upload judge view photo</span>
                          )}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'judge_view')}
                        disabled={uploading.judge || !isAuthenticated || !roomId}
                      />
                    </label>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courtroom_photos.audience_view"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience View</FormLabel>
                <div className="mt-2">
                  {courtroom_photos?.audience_view ? (
                    <div className="relative w-full h-48 rounded-md overflow-hidden border group">
                      <img 
                        src={courtroom_photos.audience_view as string} 
                        alt="Audience View" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          console.error('Error loading audience view image:', courtroom_photos.audience_view);
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="mx-1"
                          onClick={() => handleViewFullSize(courtroom_photos.audience_view as string)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="mx-1"
                          onClick={() => handleRemovePhoto('audience_view')}
                          disabled={!isAuthenticated}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md cursor-pointer bg-background hover:bg-accent/50 ${!isAuthenticated ? 'opacity-50' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploading.audience ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </span>
                          ) : (
                            <span>Click to upload audience view photo</span>
                          )}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'audience_view')}
                        disabled={uploading.audience || !isAuthenticated || !roomId}
                      />
                    </label>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!roomId && (
          <Alert variant="default" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please save the room first before uploading photos to ensure they are properly associated with this courtroom.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
