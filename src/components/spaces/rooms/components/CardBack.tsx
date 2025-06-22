
import { Button } from "@/components/ui/button";
import { RotateCcw, Users, Wrench, Calendar } from "lucide-react";
import { Room } from "../../types/RoomTypes";

interface CardBackProps {
  room: Room;
  onFlip: () => void;
}

export function CardBack({ room, onFlip }: CardBackProps) {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Room Details</h3>
        <Button variant="ghost" size="sm" onClick={onFlip}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 flex-1">
        {room.current_function && (
          <div className="flex items-start gap-2">
            <Wrench className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Current Function</p>
              <p className="text-sm text-muted-foreground">{room.current_function}</p>
            </div>
          </div>
        )}

        {room.phone_number && (
          <div className="flex items-start gap-2">
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">{room.phone_number}</p>
            </div>
          </div>
        )}

        {room.current_occupants && room.current_occupants.length > 0 && (
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Occupants</p>
              <p className="text-sm text-muted-foreground">
                {room.current_occupants.length} assigned
              </p>
            </div>
          </div>
        )}

        {room.issues && room.issues.length > 0 && (
          <div className="flex items-start gap-2">
            <div>
              <p className="text-sm font-medium">Active Issues</p>
              <p className="text-sm text-muted-foreground">
                {room.issues.length} open issue(s)
              </p>
            </div>
          </div>
        )}

        {room.space_connections && room.space_connections.length > 0 && (
          <div className="flex items-start gap-2">
            <div>
              <p className="text-sm font-medium">Connections</p>
              <p className="text-sm text-muted-foreground">
                Connected to {room.space_connections.length} space(s)
              </p>
            </div>
          </div>
        )}

        {room.storage_notes && (
          <div className="flex items-start gap-2">
            <div>
              <p className="text-sm font-medium">Storage Notes</p>
              <p className="text-sm text-muted-foreground">{room.storage_notes}</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground mt-4">
        <div>Created: {new Date(room.created_at).toLocaleDateString()}</div>
        <div>Updated: {new Date(room.updated_at).toLocaleDateString()}</div>
      </div>
    </div>
  );
}
