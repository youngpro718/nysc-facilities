import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MobilePhotoUpload } from "@/components/common/MobilePhotoUpload";

interface CourtroomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomPhotoUpload({ form }: CourtroomPhotoUploadProps) {
  const { isAuthenticated } = useAuth();
  
  const courtroom_photos = form.watch("courtroom_photos");
  const roomId = form.watch("id");

  // Ensure courtroom_photos is initialized correctly
  useEffect(() => {
    if (!courtroom_photos && roomId) {
      form.setValue("courtroom_photos", { judge_view: null, audience_view: null }, { shouldValidate: true });
    }
  }, [roomId, courtroom_photos, form]);

  const handleJudgeViewUpload = (url: string) => {
    const updatedPhotos = {
      ...(courtroom_photos || { judge_view: null, audience_view: null }),
      judge_view: url
    };
    form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
  };

  const handleAudienceViewUpload = (url: string) => {
    const updatedPhotos = {
      ...(courtroom_photos || { judge_view: null, audience_view: null }),
      audience_view: url
    };
    form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
  };

  const handleJudgeViewRemove = () => {
    const updatedPhotos = { ...courtroom_photos, judge_view: null };
    form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
  };

  const handleAudienceViewRemove = () => {
    const updatedPhotos = { ...courtroom_photos, audience_view: null };
    form.setValue("courtroom_photos", updatedPhotos, { shouldValidate: true });
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

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="courtroom_photos.judge_view"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Judge View</FormLabel>
                <div className="mt-2">
                  <MobilePhotoUpload
                    label="Judge View"
                    entityId={roomId || ""}
                    bucketName="courtroom-photos"
                    uploadPath={`rooms/${roomId}/judge_view`}
                    onUploadComplete={handleJudgeViewUpload}
                    onRemove={handleJudgeViewRemove}
                    existingUrl={courtroom_photos?.judge_view as string}
                    disabled={!isAuthenticated}
                  />
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
                  <MobilePhotoUpload
                    label="Audience View"
                    entityId={roomId || ""}
                    bucketName="courtroom-photos"
                    uploadPath={`rooms/${roomId}/audience_view`}
                    onUploadComplete={handleAudienceViewUpload}
                    onRemove={handleAudienceViewRemove}
                    existingUrl={courtroom_photos?.audience_view as string}
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
      </CardContent>
    </Card>
  );
}