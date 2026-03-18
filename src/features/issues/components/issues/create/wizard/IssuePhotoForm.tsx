
import { PhotoCapture } from "@shared/components/common/common/PhotoCapture";
import { STORAGE_BUCKETS } from '@/config';

interface IssuePhotoFormProps {
  selectedPhotos: string[];
  uploading?: boolean;
  onPhotoUpload?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function IssuePhotoForm({ selectedPhotos }: IssuePhotoFormProps) {
  // This version is display-only (used in the create wizard card view)
  return (
    <div className="space-y-4">
      <PhotoCapture
        bucket={STORAGE_BUCKETS.issuePhotos}
        photos={selectedPhotos}
        onPhotosChange={() => {}}
        maxPhotos={6}
        disabled
        compact
      />
    </div>
  );
}
