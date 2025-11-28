import { AdjacentRoom } from "@/hooks/useAdjacentRooms";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building, Lightbulb, AlertCircle } from "lucide-react";

interface AdjacentRoomsPanelProps {
  rooms: AdjacentRoom[];
  isLoading: boolean;
}

export function AdjacentRoomsPanel({ rooms, isLoading }: AdjacentRoomsPanelProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building className="h-4 w-4" />
          <h3 className="font-semibold">Nearby Rooms</h3>
        </div>
        <p className="text-sm text-muted-foreground">Loading rooms...</p>
      </Card>
    );
  }

  if (rooms.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building className="h-4 w-4" />
          <h3 className="font-semibold">Nearby Rooms</h3>
        </div>
        <p className="text-sm text-muted-foreground">No rooms found on this floor</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Building className="h-4 w-4" />
        <h3 className="font-semibold">Nearby Rooms</h3>
        <Badge variant="secondary" className="ml-auto">
          {rooms.length} rooms
        </Badge>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {rooms.map((room) => (
            <Card key={room.id} className="p-3 bg-muted/50">
              <div className="space-y-2">
                {/* Room Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">
                      🚪 {room.room_number || "N/A"} - {room.name}
                    </div>
                  </div>
                  {room.ceiling_height && (
                    <Badge variant="outline" className="text-xs">
                      {room.ceiling_height === 'standard' && '⬜ Standard'}
                      {room.ceiling_height === 'high' && '🔺 High'}
                      {room.ceiling_height === 'double_height' && '🏔️ Extra High'}
                    </Badge>
                  )}
                </div>

                {/* Bulb Type */}
                {room.primary_bulb_type && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lightbulb className="h-3 w-3" />
                    <span>
                      {room.primary_bulb_type === 'LED' && '💡 LED'}
                      {room.primary_bulb_type === 'Fluorescent' && '🔆 Fluorescent'}
                      {room.primary_bulb_type === 'Mixed' && '🔄 Mixed'}
                    </span>
                  </div>
                )}

                {/* Fixture Status */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-muted-foreground">Fixtures</span>
                    <span className="font-medium">
                      {room.actual_fixture_count}
                      {room.expected_fixture_count && 
                        ` / ${room.expected_fixture_count}`
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-muted-foreground">Working</span>
                    <Badge 
                      variant={room.functional_count === room.actual_fixture_count ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {room.functional_count}
                    </Badge>
                  </div>
                </div>

                {/* Issues Warning */}
                {(room.non_functional_count > 0 || room.maintenance_count > 0) && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded text-xs">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">
                      {room.non_functional_count > 0 && `${room.non_functional_count} out`}
                      {room.non_functional_count > 0 && room.maintenance_count > 0 && ', '}
                      {room.maintenance_count > 0 && `${room.maintenance_count} maintenance`}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
