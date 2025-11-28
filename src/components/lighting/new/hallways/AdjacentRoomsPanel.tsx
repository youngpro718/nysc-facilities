import { HallwayRoom } from "@/hooks/useHallwayRooms";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Lightbulb, AlertCircle } from "lucide-react";

interface AdjacentRoomsPanelProps {
  hallwayRooms: HallwayRoom[];
  currentFixtureSequence: number;
  totalFixtures: number;
  isLoading: boolean;
}

export function AdjacentRoomsPanel({ hallwayRooms, currentFixtureSequence, totalFixtures, isLoading }: AdjacentRoomsPanelProps) {
  // Determine current zone based on progress
  const progress = totalFixtures > 0 ? (currentFixtureSequence / totalFixtures) : 0;
  const currentZone = progress < 0.33 ? 'start' : progress < 0.67 ? 'middle' : 'end';

  // Group rooms by position
  const roomsByPosition = {
    start: hallwayRooms.filter(r => r.position === 'start'),
    middle: hallwayRooms.filter(r => r.position === 'middle'),
    end: hallwayRooms.filter(r => r.position === 'end'),
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building className="h-4 w-4" />
          <h3 className="font-semibold">Rooms Along Hallway</h3>
        </div>
        <p className="text-sm text-muted-foreground">Loading rooms...</p>
      </Card>
    );
  }

  if (hallwayRooms.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building className="h-4 w-4" />
          <h3 className="font-semibold">Rooms Along Hallway</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No rooms assigned to this hallway yet. Use "Configure Route" to assign rooms.
        </p>
      </Card>
    );
  }

  const renderRoomCard = (room: HallwayRoom, isInCurrentZone: boolean) => (
    <Card key={room.id} className={`p-3 ${isInCurrentZone ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
      <div className="space-y-2">
        {/* Room Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium">
              🚪 {room.room.room_number || "N/A"} - {room.room.name}
            </div>
            {isInCurrentZone && (
              <Badge variant="default" className="text-xs mt-1">
                📍 Current Zone
              </Badge>
            )}
          </div>
          {room.room.ceiling_height && (
            <Badge variant="outline" className="text-xs">
              {room.room.ceiling_height === 'standard' && '⬜ Standard'}
              {room.room.ceiling_height === 'high' && '🔺 High'}
              {room.room.ceiling_height === 'double_height' && '🏔️ Extra High'}
            </Badge>
          )}
        </div>

        {/* Bulb Type */}
        {room.room.primary_bulb_type && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lightbulb className="h-3 w-3" />
            <span>
              {room.room.primary_bulb_type === 'LED' && '💡 LED'}
              {room.room.primary_bulb_type === 'Fluorescent' && '🔆 Fluorescent'}
              {room.room.primary_bulb_type === 'Mixed' && '🔄 Mixed'}
            </span>
          </div>
        )}

        {/* Fixture Status */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 bg-background rounded">
            <span className="text-muted-foreground">Fixtures</span>
            <span className="font-medium">
              {room.actual_fixture_count || 0}
              {room.room.expected_fixture_count && 
                ` / ${room.room.expected_fixture_count}`
              }
            </span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-background rounded">
            <span className="text-muted-foreground">Working</span>
            <Badge 
              variant={(room.functional_count || 0) === (room.actual_fixture_count || 0) ? "default" : "secondary"}
              className="text-xs"
            >
              {room.functional_count || 0}
            </Badge>
          </div>
        </div>

        {/* Issues Warning */}
        {((room.non_functional_count || 0) > 0) && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded text-xs">
            <AlertCircle className="h-3 w-3 text-destructive" />
            <span className="text-destructive">
              {room.non_functional_count} fixtures out
            </span>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Building className="h-4 w-4" />
        <h3 className="font-semibold">Rooms Along Hallway</h3>
        <Badge variant="secondary" className="ml-auto">
          {hallwayRooms.length} rooms
        </Badge>
      </div>
      
      <Tabs defaultValue={currentZone} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="start" className="text-xs">
            Start ({roomsByPosition.start.length})
          </TabsTrigger>
          <TabsTrigger value="middle" className="text-xs">
            Middle ({roomsByPosition.middle.length})
          </TabsTrigger>
          <TabsTrigger value="end" className="text-xs">
            End ({roomsByPosition.end.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="start" className="mt-3">
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {roomsByPosition.start.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rooms at start</p>
              ) : (
                roomsByPosition.start.map((room) => renderRoomCard(room, currentZone === 'start'))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="middle" className="mt-3">
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {roomsByPosition.middle.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rooms in middle</p>
              ) : (
                roomsByPosition.middle.map((room) => renderRoomCard(room, currentZone === 'middle'))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="end" className="mt-3">
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {roomsByPosition.end.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rooms at end</p>
              ) : (
                roomsByPosition.end.map((room) => renderRoomCard(room, currentZone === 'end'))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
