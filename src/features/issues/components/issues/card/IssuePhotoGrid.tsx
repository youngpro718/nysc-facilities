import { safePhotoUrls } from "@/lib/safeUrl";

interface IssuePhotoGridProps {
  photos: string[];
}

export const IssuePhotoGrid = ({ photos }: IssuePhotoGridProps) => {
  const safe = safePhotoUrls(photos);
  if (safe.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {safe.map((photo, index) => (
        <img
          key={index}
          src={photo}
          alt={`Issue photo ${index + 1}`}
          className="w-full h-32 object-cover rounded-md"
        />
      ))}
    </div>
  );
};
