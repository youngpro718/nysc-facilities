
interface IssuePhotoGridProps {
  photos: string[];
}

export const IssuePhotoGrid = ({ photos }: IssuePhotoGridProps) => {
  if (!photos || photos.length === 0) return null;
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {photos.map((photo, index) => (
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
