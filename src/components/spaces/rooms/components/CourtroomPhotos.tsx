
import { Room } from "../types/RoomTypes";

interface CourtroomPhotosProps {
  room: Room;
}

export function CourtroomPhotos({ room }: CourtroomPhotosProps) {
  if (!room.courtroom_photos || 
      (!room.courtroom_photos.judge_view && !room.courtroom_photos.audience_view)) {
    return null;
  }

  return (
    <div className="mt-3 space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Courtroom Photos:</p>
      <div className="grid grid-cols-2 gap-2">
        {room.courtroom_photos.judge_view && (
          <div className="space-y-1">
            <img 
              src={room.courtroom_photos.judge_view} 
              alt="Judge View" 
              className="h-24 w-full object-cover rounded-md"
            />
            <p className="text-xs text-center text-muted-foreground">Judge View</p>
          </div>
        )}
        {room.courtroom_photos.audience_view && (
          <div className="space-y-1">
            <img 
              src={room.courtroom_photos.audience_view} 
              alt="Audience View" 
              className="h-24 w-full object-cover rounded-md"
            />
            <p className="text-xs text-center text-muted-foreground">Audience View</p>
          </div>
        )}
      </div>
    </div>
  );
}
