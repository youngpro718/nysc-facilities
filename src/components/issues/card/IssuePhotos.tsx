
import { IssuePhotoGrid } from "./IssuePhotoGrid";

interface IssuePhotosProps {
  photos: string[];
}

export const IssuePhotos = ({ photos }: IssuePhotosProps) => {
  if (!photos || photos.length === 0) return null;
  
  return <IssuePhotoGrid photos={photos} />;
};
