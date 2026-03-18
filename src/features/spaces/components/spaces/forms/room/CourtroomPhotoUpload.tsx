import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { AlertTriangle, Camera } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PhotoCapture } from "@shared/components/common/common/PhotoCapture";
import { STORAGE_BUCKETS } from '@/config';

interface CourtroomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
}

export function CourtroomPhotoUpload({ form }: CourtroomPhotoUploadProps) {
  const { isAuthenticated } = useAuth();
  const courtroom_photos = form.watch("courtroom_photos");
  const roomId = form.watch("id");

  useEffect(() => {
    if (!courtroom_photos && roomId) {
      form.setValue("courtroom_photos", { judge_view: [], audience_view: [] }, { shouldValidate: true });
    }
  }, [roomId, courtroom_photos, form]);

  const judgeViewPhotos = courtroom_photos?.judge_view || [];
  const audienceViewPhotos = courtroom_photos?.audience_view || [];

  const handleJudgePhotosChange = (urls: string[]) => {
    form.setValue("courtroom_photos", {
      ...(courtroom_photos || { judge_view: [], audience_view: [] }),
      judge_view: urls,
    }, { shouldValidate: true });
  };

  const handleAudiencePhotosChange = (urls: string[]) => {
    form.setValue("courtroom_photos", {
      ...(courtroom_photos || { judge_view: [], audience_view: [] }),
      audience_view: urls,
    }, { shouldValidate: true });
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
            <AlertDescription>You must be logged in to upload or remove photos</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="courtroom_photos.judge_view"
            render={() => (
              <FormItem>
                <FormLabel className="text-base font-medium">Judge View</FormLabel>
                <PhotoCapture
                  bucket={STORAGE_BUCKETS.courtroomPhotos}
                  photos={judgeViewPhotos}
                  onPhotosChange={handleJudgePhotosChange}
                  maxPhotos={4}
                  pathPrefix={roomId ? `rooms/${roomId}/judge_view` : ""}
                  disabled={!isAuthenticated || !roomId}
                  compact
                  label="Add Judge View"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courtroom_photos.audience_view"
            render={() => (
              <FormItem>
                <FormLabel className="text-base font-medium">Audience View</FormLabel>
                <PhotoCapture
                  bucket={STORAGE_BUCKETS.courtroomPhotos}
                  photos={audienceViewPhotos}
                  onPhotosChange={handleAudiencePhotosChange}
                  maxPhotos={4}
                  pathPrefix={roomId ? `rooms/${roomId}/audience_view` : ""}
                  disabled={!isAuthenticated || !roomId}
                  compact
                  label="Add Audience View"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!roomId && (
          <Alert variant="default" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Please save the room first before uploading photos.</AlertDescription>
          </Alert>
        )}

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
