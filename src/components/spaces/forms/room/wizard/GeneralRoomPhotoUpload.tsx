import { useState } from "react";
import { logger } from '@/lib/logger';
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../RoomFormSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Upload, X, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { storageService } from "@/services/storage";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GeneralRoomPhotoUploadProps {
  form: UseFormReturn<RoomFormData>;
  roomId?: string;
}

export function GeneralRoomPhotoUpload({ form, roomId }: GeneralRoomPhotoUploadProps) {
  const { isAuthenticated } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generalPhotos = form.watch("generalPhotos") || [];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!roomId) {
      toast.error("Please save the room first before uploading photos");
      return;
    }

    const files = Array.from(event.target.files);
    const maxPhotos = 6;

    if (generalPhotos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);

    try {
      const uploadedPhotos = await Promise.all(
        files.map(async (file) => {
          const url = await storageService.uploadFile("room-photos", file, {
            entityId: roomId,
          });

          if (!url) throw new Error("Upload failed");

          return {
            url,
            caption: null,
            uploadedAt: new Date().toISOString(),
          };
        })
      );

      const updatedPhotos = [...generalPhotos, ...uploadedPhotos];
      form.setValue("generalPhotos", updatedPhotos, { shouldValidate: true });
      toast.success(`${uploadedPhotos.length} photo(s) uploaded successfully`);
    } catch (error) {
      logger.error("Error uploading photos:", error);
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const photo = generalPhotos[index];
    
    // Remove from storage
    const filename = storageService.getFilenameFromUrl(photo.url);
    if (filename) {
      await storageService.removeFile("room-photos", filename);
    }

    // Update form
    const updatedPhotos = generalPhotos.filter((_, i) => i !== index);
    form.setValue("generalPhotos", updatedPhotos, { shouldValidate: true });
    toast.success("Photo removed");
  };

  const handleUpdateCaption = (index: number, caption: string) => {
    const updatedPhotos = [...generalPhotos];
    updatedPhotos[index] = { ...updatedPhotos[index], caption };
    form.setValue("generalPhotos", updatedPhotos, { shouldValidate: true });
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
            <AlertDescription>
              You must be logged in to upload or remove photos
            </AlertDescription>
          </Alert>
        )}

        {!roomId && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please save the room first before uploading photos
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        {generalPhotos.length < 6 && roomId && isAuthenticated && (
          <div>
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload photos ({generalPhotos.length}/6)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG up to 10MB
                </p>
              </div>
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading || !isAuthenticated}
            />
          </div>
        )}

        {/* Photo Grid */}
        {generalPhotos.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {generalPhotos.map((photo, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  <img
                    src={photo.url}
                    alt={photo.caption || `Room photo ${index + 1}`}
                    className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewUrl(photo.url)}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => handleRemovePhoto(index)}
                    disabled={!isAuthenticated}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <Input
                    placeholder="Add caption (optional)"
                    value={photo.caption || ""}
                    onChange={(e) => handleUpdateCaption(index, e.target.value)}
                    maxLength={50}
                    disabled={!isAuthenticated}
                    className="text-sm"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {generalPhotos.length === 0 && roomId && (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No photos uploaded yet</p>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
