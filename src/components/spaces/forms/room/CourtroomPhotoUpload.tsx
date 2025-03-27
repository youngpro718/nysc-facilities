
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { Loader2, Upload, X, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";

interface CourtroomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomPhotoUpload({ form }: CourtroomPhotoUploadProps) {
  const { isAuthenticated } = useAuth();
  const { isUploading, error, uploadFile, removeFile, setError } = usePhotoUpload();
  const [uploadingView, setUploadingView] = useState<'judge_view' | 'audience_view' | null>(null);
  
  const roomId = form.watch("id");
  const roomType = form.watch("roomType");
  const courtroom_photos = form.watch("courtroom_photos") || { judge_view: null, audience_view: null };

  // Check authentication status when component mounts
  useEffect(() => {
    if (!isAuthenticated) {
      setError("You must be logged in to upload photos");
    } else {
      setError(null);
    }
  }, [isAuthenticated, setError]);

  // Ensure courtroom_photos object is initialized correctly
  useEffect(() => {
    // Initialize courtroom_photos if it doesn't exist and we have a roomId
    if (!form.getValues("courtroom_photos") && roomId) {
      form.setValue("courtroom_photos", { 
        judge_view: null, 
        audience_view: null 
      }, { shouldValidate: true });
    }
  }, [roomId, form]);

  // Handle file upload for courtroom photos
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
      setUploadingView(view);
      
      const publicUrl = await uploadFile(file, {
        entityId: roomId,
        bucketName: 'courtroom-photos',
        category: view,
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
      
    } catch (error) {
      console.error('Error handling file upload:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingView(null);
      
      // Reset the file input
      event.target.value = '';
    }
  };

  // Handle removing an existing photo
  const handleRemovePhoto = async (view: 'judge_view' | 'audience_view') => {
    if (!courtroom_photos?.[view]) return;
    
    if (!isAuthenticated) {
      toast.error("You must be logged in to remove photos");
      return;
    }
    
    try {
      const url = courtroom_photos[view] as string;
      const success = await removeFile(url, 'courtroom-photos');
      
      if (success) {
        const updatedPhotos = { ...courtroom_photos, [view]: null };
        form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
        toast.success(`${view === 'judge_view' ? 'Judge view' : 'Audience view'} photo removed`);
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error(`Failed to remove photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle viewing a photo in full size in a new tab
  const handleViewFullSize = (url: string | null) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  // Only show the component if this is a courtroom
  if (roomType !== 'courtroom') {
    return null;
  }

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
                    <label className={`flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md cursor-pointer bg-background hover:bg-accent/50 ${!isAuthenticated || !roomId ? 'opacity-50' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingView === 'judge_view' ? (
                          <>
                            <Loader2 className="w-8 h-8 mb-4 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload judge view photo
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'judge_view')}
                        disabled={!!uploadingView || !isAuthenticated || !roomId}
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
                    <label className={`flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md cursor-pointer bg-background hover:bg-accent/50 ${!isAuthenticated || !roomId ? 'opacity-50' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingView === 'audience_view' ? (
                          <>
                            <Loader2 className="w-8 h-8 mb-4 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload audience view photo
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'audience_view')}
                        disabled={!!uploadingView || !isAuthenticated || !roomId}
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
