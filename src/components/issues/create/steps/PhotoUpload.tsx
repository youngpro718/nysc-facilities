
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Camera, Loader2 } from "lucide-react";
import { IssuePhotoGrid } from "../../card/IssuePhotoGrid";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";

export function PhotoUpload() {
  const { uploading, selectedPhotos, handlePhotoUpload } = usePhotoUpload();

  return (
    <div className="space-y-6">
      <div>
        <FormLabel>Add Photos</FormLabel>
        <div className="flex flex-col items-center justify-center w-full">
          <label className="w-full cursor-pointer">
            <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-white/10 bg-background/50 hover:bg-background/70 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 mb-2 text-primary" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </p>
                  </>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </label>
        </div>
      </div>

      <IssuePhotoGrid photos={selectedPhotos} />
    </div>
  );
}
