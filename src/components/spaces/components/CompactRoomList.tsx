import React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  MapPin, 
  Users, 
  AlertTriangle, 
  Activity,
  Building,
  Layers
} from "lucide-react";
import { Room } from "../rooms/types/RoomTypes";

interface CompactRoomListProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onRoomSelect: (room: Room) => void;
  isLoading?: boolean;
}

export function CompactRoomList({ 
  rooms, 
  selectedRoomId, 
  onRoomSelect, 
  isLoading 
}: CompactRoomListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'under_maintenance':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="h-3 w-3" />;
      case 'under_maintenance':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Loading rooms...
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <div>
          <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No rooms found</h3>
          <p className="text-muted-foreground">
            No rooms match the current filter criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => onRoomSelect(room)}
            className={cn(
              "p-3 rounded-lg cursor-pointer transition-all duration-150",
              "hover:bg-muted/50 hover:shadow-sm",
              "border border-transparent",
              selectedRoomId === room.id && 
              "bg-primary/5 border-primary/20 shadow-sm"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{room.room_number}</span>
                <Badge 
                  variant={getStatusColor(room.status)} 
                  className="flex items-center gap-1 text-xs"
                >
                  {getStatusIcon(room.status)}
                  {room.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {room.issues?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    {room.issues.length}
                  </div>
                )}
                {room.current_occupants?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {room.current_occupants.length}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground truncate">
                {room.name || 'Unnamed Room'}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  <span className="truncate">{room.floor?.building?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  <span className="truncate">{room.floor?.name || 'Unknown'}</span>
                </div>
                {room.room_type && (
                  <Badge variant="outline" className="text-xs py-0 px-1">
                    {room.room_type}
                  </Badge>
                )}
              </div>
              
              {room.phone_number && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{room.phone_number}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}