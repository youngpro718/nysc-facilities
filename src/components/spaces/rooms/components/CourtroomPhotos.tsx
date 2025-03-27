
import { Room } from '../types/RoomTypes';
import { BadgeInfo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourtroomPhotoViewer } from './CourtroomPhotoViewer';

interface CourtroomPhotosProps {
  room: Room;
}

export function CourtroomPhotos({ room }: CourtroomPhotosProps) {
  // Use the correct property name from the Room type
  const photos = room.courtroom_photos;
  
  // Check if room has courtroom photos
  const hasPhotos = photos && (photos.judge_view || photos.audience_view);
  
  // If no photos or not a courtroom, don't render anything
  if (!hasPhotos || room.room_type !== 'courtroom') return null;
  
  return (
    <CourtroomPhotoViewer
      photos={photos}
      roomName={room.name}
      roomId={room.id}
      trigger={
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-1 px-0 flex items-center"
        >
          <BadgeInfo className="h-4 w-4 mr-1" />
          <span>View Courtroom Photos</span>
        </Button>
      }
    />
  );
}
