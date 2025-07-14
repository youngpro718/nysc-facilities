import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { Loader2, Upload, X, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface CourtroomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomPhotoUpload({ form }: CourtroomPhotoUploadProps) {
  const { isAuthenticated } = useAuth();
  const [uploadingView, setUploadingView] = useState<'judge_view' | 'audience_view' | null>(null);
  
  const courtroom_photos = form.watch("courtroom_photos");
  const roomId = form.watch("id");

  useEffect(() => {
    if (!isAuthenticated) {
      // setError("You must be logged in to upload photos");
    } else {
      // setError(null);
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
      setUploadingView(view);
      
      // Check if bucket exists and create it if it doesn't
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'courtroom-photos');
        
        if (!bucketExists) {
          console.log('Creating courtroom-photos bucket...');
          try {
            const { error: createError } = await supabase.storage.createBucket('courtroom-photos', {
              public: true
            });
            
            if (createError) {
              // Handle row-level security policy violations gracefully
              if (createError.message?.includes('row-level security policy')) {
                console.log('Bucket creation failed due to permissions, but will continue with upload anyway');
                // Continue with upload as if bucket exists - it might be accessible even if we can't create it
              } else {
                console.error('Error creating bucket:', createError);
              }
            } else {
              console.log('Successfully created courtroom-photos bucket');
            }
          } catch (bucketCreateError) {
            // Catch and log but continue with upload
            console.error('Exception creating bucket:', bucketCreateError);
          }
        }
      } catch (bucketError) {
        console.error('Error checking/creating bucket:', bucketError);
        // Continue anyway as the upload might still work
      }
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      // Create a structured path using roomId and view
      const filePath = `rooms/${roomId}/${view}/${fileName}`;
      
      console.log(`Uploading file to courtroom-photos at path: ${filePath}`);
      
      // Upload directly using Supabase client
      const { error: uploadError } = await supabase.storage
        .from('courtroom-photos')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = await supabase.storage
        .from('courtroom-photos')
        .getPublicUrl(filePath);
      
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

  const handleRemovePhoto = async (view: 'judge_view' | 'audience_view') => {
    if (!courtroom_photos?.[view]) return;
    
    if (!isAuthenticated) {
      toast.error("You must be logged in to remove photos");
      return;
    }
    
    try {
      const url = courtroom_photos[view] as string;
      const filePath = url.split('/').pop();
      const { error } = await supabase.storage
        .from('courtroom-photos')
        .remove([filePath]);
      
      if (error) {
        console.error('Error removing photo:', error);
        throw error;
      }
      
      const updatedPhotos = { ...courtroom_photos, [view]: null };
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
        
        {/* {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )} */}

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
                          {uploadingView === 'judge_view' ? (
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
                    <label className={`flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md cursor-pointer bg-background hover:bg-accent/50 ${!isAuthenticated ? 'opacity-50' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploadingView === 'audience_view' ? (
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
