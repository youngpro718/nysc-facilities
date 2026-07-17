
import { PhotoCapture } from "@shared/components/common/common/PhotoCapture";
import { STORAGE_BUCKETS } from '@/config';

interface IssuePhotoFormProps {
  selectedPhotos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export function IssuePhotoForm({ selectedPhotos, onPhotosChange }: IssuePhotoFormProps) {
  return (
    <div className="space-y-4">
      <PhotoCapture
        bucket={STORAGE_BUCKETS.issuePhotos}
        photos={selectedPhotos}
        onPhotosChange={onPhotosChange}
        maxPhotos={6}
        compact
      />
    </div>
  );
}
