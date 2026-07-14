import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Room } from '../types/RoomTypes';
import { getRoomTypeColor, getRoomTypeName } from "../../utils/roomTypeUtils";
import { CourtroomPhotos } from "../components/CourtroomPhotos";
import { ClearCourtroomPhotos } from "../components/ClearCourtroomPhotos";
import { Droplets } from "lucide-react";

interface RoomDetailsProps {
  room: Room;
}

export function RoomDetails({ room }: RoomDetailsProps) {
  if (!room) return null;
  
  const roomTypeName = getRoomTypeName(room.room_type);
  const roomTypeColor = getRoomTypeColor(room.room_type);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3 className="font-medium text-lg">Room Details</h3>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`${roomTypeColor} font-medium`}>
            {roomTypeName}
          </Badge>
          
          <Badge variant="outline" className={room.status === 'active' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'}>
            {room.status === 'active' ? 'Active' : room.status === 'inactive' ? 'Inactive' : 'Under Maintenance'}
          </Badge>
          
          {room.is_storage && (
            <Badge variant="outline" className="bg-blue-500/20 text-blue-700 dark:text-blue-400">
              Storage
            </Badge>
          )}
        </div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Room Number</p>
          <p className="font-medium">{room.room_number || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Function</p>
          <p className="font-medium">{room.current_function || 'N/A'}</p>
        </div>
        {room.phone_number && (
          <div>
            <p className="text-sm text-muted-foreground">Phone Number</p>
            <p className="font-medium">{room.phone_number}</p>
          </div>
        )}
        {(room.water_cooler_count ?? 0) > 0 && (
          <div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Droplets className="h-3.5 w-3.5 text-sky-600" />
              Water Coolers
            </p>
            <p className="font-medium">{room.water_cooler_count}</p>
          </div>
        )}
      </div>

      {room.water_cooler_notes && (
        <p className="text-sm text-muted-foreground">{room.water_cooler_notes}</p>
      )}
      
      {room.description && (
        <>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{room.description}</p>
          </div>
        </>
      )}
      
      {room.is_storage && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium">Storage Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Storage Type</p>
                <p className="font-medium">{room.storage_type || 'General'}</p>
              </div>
              {room.storage_capacity !== null && room.storage_capacity !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">{room.storage_capacity} cubic ft</p>
                </div>
              )}
            </div>
            {room.storage_notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Storage Notes</p>
                <p className="text-sm">{room.storage_notes}</p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Add the Courtroom Photos component when room is a courtroom */}
      {room.room_type === 'courtroom' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Courtroom Photos</h4>
            <ClearCourtroomPhotos roomId={room.id} />
          </div>
          <CourtroomPhotos room={room} />
        </div>
      )}
    </div>
  );
}
