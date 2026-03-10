import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PhotoCapture } from "@/components/common/PhotoCapture";

interface GeneralRoomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
  roomId?: string;
}

export function GeneralRoomPhotoUpload({ form, roomId }: GeneralRoomPhotoUploadProps) {
  const { isAuthenticated } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generalPhotos = form.watch("generalPhotos") || [];

  // Convert form photo objects to URL strings for PhotoCapture
  const photoUrls = generalPhotos.map((p) => p.url);

  const handlePhotosChange = (urls: string[]) => {
    // Map URLs back to photo objects, keeping existing ones and adding new
    const updated = urls.map((url) => {
      const existing = generalPhotos.find((p) => p.url === url);
      return existing || { url, caption: null, uploadedAt: new Date().toISOString() };
    });
    form.setValue("generalPhotos", updated, { shouldValidate: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>You must be logged in to upload or remove photos</AlertDescription>
          </Alert>
        )}

        {!roomId && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Please save the room first before uploading photos</AlertDescription>
          </Alert>
        )}

        {roomId && isAuthenticated ? (
          <PhotoCapture
            bucket="room-photos"
            photos={photoUrls}
            onPhotosChange={handlePhotosChange}
            maxPhotos={6}
            pathPrefix={roomId}
          />
        ) : generalPhotos.length === 0 && roomId ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No photos uploaded yet</p>
          </div>
        ) : null}

        {/* Click to preview */}
        {photoUrls.length > 0 && (
          <div className="grid gap-2 grid-cols-3">
            {photoUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Room photo ${i + 1}`}
                className="w-full aspect-video object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-border"
                onClick={() => setPreviewUrl(url)}
              />
            ))}
          </div>
        )}

        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl">
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-lg" />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
