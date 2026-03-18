
import { PhotoCapture } from "@shared/components/common/common/PhotoCapture";
import { STORAGE_BUCKETS } from '@/config';

interface IssuePhotoFormProps {
  selectedPhotos: string[];
  uploading?: boolean;
  onPhotoUpload?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onPhotoRemove?: (index: number) => void;
  onPhotosChange?: (photos: string[]) => void;
}

export function IssuePhotoForm({
  selectedPhotos,
  onPhotoRemove,
  onPhotosChange,
}: IssuePhotoFormProps) {
  const handleChange = (photos: string[]) => {
    if (onPhotosChange) {
      onPhotosChange(photos);
    }
  };

  // If parent only provides onPhotoRemove (legacy), wrap it
  const handlePhotosChange = onPhotosChange
    ? handleChange
    : (photos: string[]) => {
        // Find removed index
        if (photos.length < selectedPhotos.length && onPhotoRemove) {
          const removedIdx = selectedPhotos.findIndex((p, i) => photos[i] !== p);
          if (removedIdx !== -1) onPhotoRemove(removedIdx);
        }
      };

  return (
    <div className="space-y-4">
      <PhotoCapture
        bucket={STORAGE_BUCKETS.issuePhotos}
        photos={selectedPhotos}
        onPhotosChange={handlePhotosChange}
        maxPhotos={6}
        compact
      />
    </div>
  );
}
