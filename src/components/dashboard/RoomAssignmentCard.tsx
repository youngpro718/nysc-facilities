
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin } from "lucide-react";
import { useRoomAssignments } from "@/hooks/dashboard/useRoomAssignments";

interface RoomAssignmentCardProps {
  userId: string;
}

export function RoomAssignmentCard({ userId }: RoomAssignmentCardProps) {
  const { assignedRooms } = useRoomAssignments(userId);

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg sm:text-2xl font-semibold">Room Assignments</h2>
        </div>
        <Badge variant="secondary" className="font-normal">
          {assignedRooms.length} rooms
        </Badge>
      </div>
      
      <div className="p-4 sm:p-6">
        {assignedRooms.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Building2 className="h-8 w-8" />
            <p>No room assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedRooms.slice(0, 3).map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-start justify-between p-3 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{assignment.room_name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    Room {assignment.room_number}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {assignment.building_name} • {assignment.floor_name}
                  </div>
                </div>
                {assignment.is_primary && (
                  <Badge variant="default" className="text-xs ml-2 shrink-0">
                    Primary
                  </Badge>
                )}
              </div>
            ))}
            {assignedRooms.length > 3 && (
              <div className="text-center py-2 text-sm text-muted-foreground">
                +{assignedRooms.length - 3} more rooms
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
