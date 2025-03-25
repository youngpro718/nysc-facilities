
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { Loader2, Upload, X, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { storageService } from "@/services/storage";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface CourtroomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomPhotoUpload({ form }: CourtroomPhotoUploadProps) {
  const { isAuthenticated, refreshSession } = useAuth();
  const [uploading, setUploading] = useState({
    judge: false,
    audience: false
  });
  const [error, setError] = useState<string | null>(null);
  const [isVerifyingStorage, setIsVerifyingStorage] = useState(false);
  const [storageVerified, setStorageVerified] = useState<boolean | null>(null);
  
  const courtroom_photos = form.watch("courtroom_photos");

  // Verify storage bucket on component mount
  useEffect(() => {
    const verifyStorage = async () => {
      if (!isAuthenticated) {
        setError("You must be logged in to upload photos");
        return;
      }
      
      try {
        setIsVerifyingStorage(true);
        setError(null);
        
        // Check if user session is valid
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          console.log("Session expired or not found, refreshing...");
          await refreshSession();
        }
        
        // Verify bucket exists
        const bucketExists = await storageService.checkBucketExists('courtroom-photos');
        setStorageVerified(bucketExists);
        
        if (!bucketExists) {
          setError("Storage system is not properly configured. Please contact your administrator.");
        }
      } catch (err) {
        console.error("Storage verification error:", err);
        setError("Failed to verify storage system. Please try again later.");
      } finally {
        setIsVerifyingStorage(false);
      }
    };

    if (isAuthenticated) {
      verifyStorage();
    }
  }, [isAuthenticated, refreshSession]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, view: 'judge_view' | 'audience_view') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      toast.error("You must be logged in to upload photos");
      return;
    }

    try {
      setUploading(prev => ({
        ...prev,
        [view === 'judge_view' ? 'judge' : 'audience']: true
      }));
      setError(null);
      
      // Refresh session before upload
      await refreshSession();
      
      // The correct bucket name with hyphens
      const BUCKET_NAME = 'courtroom-photos';
      console.log(`Uploading file to bucket: ${BUCKET_NAME}`);
      
      // Upload the file
      const publicUrl = await storageService.uploadFile(BUCKET_NAME, file);

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
      
      // Refresh session before delete
      await refreshSession();
      
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

  const handleRetryStorageCheck = async () => {
    try {
      setIsVerifyingStorage(true);
      setError(null);
      
      // Force refresh the session
      await refreshSession();
      
      // Verify bucket exists
      const bucketExists = await storageService.checkBucketExists('courtroom-photos');
      setStorageVerified(bucketExists);
      
      if (bucketExists) {
        toast.success("Storage system successfully verified");
      } else {
        setError("Storage system is still not properly configured. Please contact your administrator.");
      }
    } catch (err) {
      console.error("Storage verification retry error:", err);
      setError("Failed to verify storage system. Please try again later.");
    } finally {
      setIsVerifyingStorage(false);
    }
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
        
        {isAuthenticated && storageVerified === false && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Storage system is not available. Please contact your administrator.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetryStorageCheck}
                disabled={isVerifyingStorage}
              >
                {isVerifyingStorage ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetryStorageCheck}
                disabled={isVerifyingStorage}
              >
                {isVerifyingStorage ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Retry
              </Button>
            </AlertDescription>
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
                    <div className="relative w-full h-48 rounded-md overflow-hidden border">
                      <img 
                        src={courtroom_photos.judge_view as string} 
                        alt="Judge View" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error loading judge view image:', courtroom_photos.judge_view);
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemovePhoto('judge_view')}
                        disabled={!isAuthenticated || isVerifyingStorage || storageVerified === false}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md cursor-pointer bg-background hover:bg-accent/50 ${!isAuthenticated || isVerifyingStorage || storageVerified === false ? 'opacity-50' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isVerifyingStorage ? (
                          <Loader2 className="w-8 h-8 mb-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        )}
                        <p className="text-sm text-muted-foreground">
                          {uploading.judge ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </span>
                          ) : isVerifyingStorage ? (
                            <span>Verifying storage...</span>
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
                        disabled={uploading.judge || !isAuthenticated || isVerifyingStorage || storageVerified === false}
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
                    <div className="relative w-full h-48 rounded-md overflow-hidden border">
                      <img 
                        src={courtroom_photos.audience_view as string} 
                        alt="Audience View" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Error loading audience view image:', courtroom_photos.audience_view);
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemovePhoto('audience_view')}
                        disabled={!isAuthenticated || isVerifyingStorage || storageVerified === false}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-md cursor-pointer bg-background hover:bg-accent/50 ${!isAuthenticated || isVerifyingStorage || storageVerified === false ? 'opacity-50' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isVerifyingStorage ? (
                          <Loader2 className="w-8 h-8 mb-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        )}
                        <p className="text-sm text-muted-foreground">
                          {uploading.audience ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </span>
                          ) : isVerifyingStorage ? (
                            <span>Verifying storage...</span>
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
                        disabled={uploading.audience || !isAuthenticated || isVerifyingStorage || storageVerified === false}
                      />
                    </label>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
