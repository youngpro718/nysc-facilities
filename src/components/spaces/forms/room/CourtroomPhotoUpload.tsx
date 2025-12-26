import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { AlertTriangle, Plus, X, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MobilePhotoUpload } from "@/components/common/MobilePhotoUpload";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourtroomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomPhotoUpload({ form }: CourtroomPhotoUploadProps) {
  const { isAuthenticated } = useAuth();
  
  const courtroom_photos = form.watch("courtroom_photos");
  const roomId = form.watch("id");

  // Ensure courtroom_photos is initialized correctly with array structure
  useEffect(() => {
    if (!courtroom_photos && roomId) {
      form.setValue("courtroom_photos", { judge_view: [], audience_view: [] }, { shouldValidate: true });
    }
  }, [roomId, courtroom_photos, form]);

  // Get current photos as arrays
  const judgeViewPhotos = courtroom_photos?.judge_view || [];
  const audienceViewPhotos = courtroom_photos?.audience_view || [];

  const handleJudgeViewUpload = (url: string) => {
    const currentPhotos = [...(courtroom_photos?.judge_view || [])];
    currentPhotos.push(url);
    const updatedPhotos = {
      ...(courtroom_photos || { judge_view: [], audience_view: [] }),
      judge_view: currentPhotos
    };
    form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
  };

  const handleAudienceViewUpload = (url: string) => {
    const currentPhotos = [...(courtroom_photos?.audience_view || [])];
    currentPhotos.push(url);
    const updatedPhotos = {
      ...(courtroom_photos || { judge_view: [], audience_view: [] }),
      audience_view: currentPhotos
    };
    form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
  };

  const handleRemoveJudgePhoto = (index: number) => {
    const currentPhotos = [...(courtroom_photos?.judge_view || [])];
    currentPhotos.splice(index, 1);
    const updatedPhotos = { ...courtroom_photos, judge_view: currentPhotos };
    form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
  };

  const handleRemoveAudiencePhoto = (index: number) => {
    const currentPhotos = [...(courtroom_photos?.audience_view || [])];
    currentPhotos.splice(index, 1);
    const updatedPhotos = { ...courtroom_photos, audience_view: currentPhotos };
    form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Courtroom Photos
        </CardTitle>
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Judge View Section */}
          <FormField
            control={form.control}
            name="courtroom_photos.judge_view"
            render={() => (
              <FormItem>
                <FormLabel className="text-base font-medium">Judge View</FormLabel>
                <div className="mt-2 space-y-3">
                  {/* Existing Photos Grid */}
                  {judgeViewPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {judgeViewPhotos.map((url, index) => (
                        <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border border-border">
                          <img 
                            src={url} 
                            alt={`Judge View ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveJudgePhoto(index)}
                            disabled={!isAuthenticated}
                            className={cn(
                              "absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground",
                              "opacity-0 group-hover:opacity-100 transition-opacity",
                              !isAuthenticated && "cursor-not-allowed"
                            )}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add New Photo Button */}
                  <MobilePhotoUpload
                    label={judgeViewPhotos.length > 0 ? "Add Another Photo" : "Add Judge View Photo"}
                    entityId={roomId || ""}
                    bucketName="courtroom-photos"
                    uploadPath={`rooms/${roomId}/judge_view_${Date.now()}`}
                    onUploadComplete={handleJudgeViewUpload}
                    onRemove={() => {}}
                    existingUrl=""
                    disabled={!isAuthenticated}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Audience View Section */}
          <FormField
            control={form.control}
            name="courtroom_photos.audience_view"
            render={() => (
              <FormItem>
                <FormLabel className="text-base font-medium">Audience View</FormLabel>
                <div className="mt-2 space-y-3">
                  {/* Existing Photos Grid */}
                  {audienceViewPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {audienceViewPhotos.map((url, index) => (
                        <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border border-border">
                          <img 
                            src={url} 
                            alt={`Audience View ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAudiencePhoto(index)}
                            disabled={!isAuthenticated}
                            className={cn(
                              "absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground",
                              "opacity-0 group-hover:opacity-100 transition-opacity",
                              !isAuthenticated && "cursor-not-allowed"
                            )}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add New Photo Button */}
                  <MobilePhotoUpload
                    label={audienceViewPhotos.length > 0 ? "Add Another Photo" : "Add Audience View Photo"}
                    entityId={roomId || ""}
                    bucketName="courtroom-photos"
                    uploadPath={`rooms/${roomId}/audience_view_${Date.now()}`}
                    onUploadComplete={handleAudienceViewUpload}
                    onRemove={() => {}}
                    existingUrl=""
                    disabled={!isAuthenticated}
                  />
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
        
        {/* Photo Count Summary */}
        {(judgeViewPhotos.length > 0 || audienceViewPhotos.length > 0) && (
          <div className="text-sm text-muted-foreground">
            Total: {judgeViewPhotos.length + audienceViewPhotos.length} photos 
            ({judgeViewPhotos.length} judge view, {audienceViewPhotos.length} audience view)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
