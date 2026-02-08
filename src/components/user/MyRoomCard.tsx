import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import { useOccupantAssignments } from "@/components/occupants/hooks/useOccupantAssignments";

interface MyRoomCardProps {
  userId: string;
}

export function MyRoomCard({ userId }: MyRoomCardProps) {
  // Users are always 'profile' type (they have auth accounts)
  const { data: assignments, isLoading } = useOccupantAssignments(userId, 'profile');
  
  // Find primary room or first assigned room
  const primaryAssignment = assignments?.roomDetails?.find(a => a.is_primary) 
    || assignments?.roomDetails?.[0];
  
  // Don't show loading state, just don't render if no room
  if (isLoading || !primaryAssignment) {
    return null;
  }
  
  // rooms comes from the Supabase join - it could be an object or array
  const roomsData = primaryAssignment.rooms as Record<string, unknown>;
  const room = Array.isArray(roomsData) ? roomsData[0] : roomsData;
  
  if (!room) {
    return null;
  }
  
  // Handle the nested structure - floors may be an array or object
  const floorsData = room.floors;
  const floors = Array.isArray(floorsData) ? floorsData[0] : floorsData;
  const buildingsData = floors?.buildings;
  const building = Array.isArray(buildingsData) ? buildingsData[0] : buildingsData;
  
  const floorName = floors?.name;
  const buildingName = building?.name;
  
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">
                Room {room.room_number || room.name}
              </span>
              <Badge variant="secondary" className="text-xs gap-1">
                <Star className="h-3 w-3 fill-current" />
                My Room
              </Badge>
            </div>
            {(floorName || buildingName) && (
              <p className="text-xs text-muted-foreground truncate">
                {[floorName, buildingName].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
