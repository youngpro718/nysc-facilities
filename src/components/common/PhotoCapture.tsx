
import { useState, useRef } from "react";
import { Camera, Loader2, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";

interface PhotoCaptureProps {
  /** Storage bucket name */
  bucket: string;
  /** Already-uploaded photo URLs */
  photos: string[];
  /** Called when photos array changes */
  onPhotosChange: (photos: string[]) => void;
  /** Max number of photos allowed */
  maxPhotos?: number;
  /** Optional path prefix in the bucket */
  pathPrefix?: string;
  /** Disable interactions */
  disabled?: boolean;
  /** Show a compact inline style (no large CTA) */
  compact?: boolean;
  /** Custom label for the upload button */
  label?: string;
}

export function PhotoCapture({
  bucket,
  photos,
  onPhotosChange,
  maxPhotos = 6,
  pathPrefix = "",
  disabled = false,
  compact = false,
  label,
}: PhotoCaptureProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    if (photos.length + fileArray.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];

    try {
      for (const file of fileArray) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10MB limit`);
          continue;
        }

        const ext = file.name.split(".").pop();
        const path = pathPrefix
          ? `${pathPrefix}/${crypto.randomUUID()}.${ext}`
          : `${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);

        uploaded.push(publicUrl);
      }

      if (uploaded.length > 0) {
        onPhotosChange([...photos, ...uploaded]);
        toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err) || "Upload failed");
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const atLimit = photos.length >= maxPhotos;

  return (
    <div className="space-y-3">
      {/* Thumbnail strip */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {photos.map((url, i) => (
            <div
              key={i}
              className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border"
            >
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                disabled={disabled}
                className={cn(
                  "absolute top-0.5 right-0.5 p-1 rounded-full",
                  "bg-destructive text-destructive-foreground",
                  "min-h-[28px] min-w-[28px] flex items-center justify-center",
                  "transition-opacity touch-manipulation",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload trigger */}
      {!atLimit && !disabled && (
        <label className="cursor-pointer block">
          <div
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors",
              "text-sm text-muted-foreground touch-manipulation active:scale-[0.98]",
              compact
                ? "py-3 px-4"
                : "py-6 px-4 flex-col",
              "hover:border-primary/50 hover:bg-primary/5",
              uploading && "opacity-50 pointer-events-none"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Uploading…</span>
              </>
            ) : compact ? (
              <>
                <ImagePlus className="h-5 w-5" />
                <span>{label || (photos.length > 0 ? "Add more" : "Add photo")}</span>
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 text-primary" />
                <span className="font-medium">
                  {label || (photos.length > 0 ? "Add more photos" : "Take or choose a photo")}
                </span>
                <span className="text-xs">
                  {photos.length}/{maxPhotos} · JPG, PNG up to 10MB
                </span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleUpload}
            disabled={uploading || disabled}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
