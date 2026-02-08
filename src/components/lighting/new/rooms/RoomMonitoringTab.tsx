import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, DoorOpen, Lightbulb, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useLightingRooms, useRoomFixtures } from '@/hooks/useLightingRooms';
import { RoomDetailView } from './RoomDetailView';

export function RoomMonitoringTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showIssuesOnly, setShowIssuesOnly] = useState(false);

  const { data: rooms, isLoading } = useLightingRooms();
  const { data: selectedRoomFixtures } = useRoomFixtures(selectedRoomId);

  // If a room is selected, show the detail view
  if (selectedRoomId && selectedRoomFixtures) {
    const selectedRoom = rooms?.find(r => r.id === selectedRoomId);
    if (selectedRoom) {
      return (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedRoomId(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Room List
          </Button>
          <RoomDetailView room={selectedRoom} fixtures={selectedRoomFixtures} />
        </div>
      );
    }
  }

  // Filter rooms based on search and issues toggle
  const filteredRooms = rooms?.filter(room => {
    // Filter by issues if toggle is on
    if (showIssuesOnly && room.non_functional_count === 0 && room.maintenance_count === 0) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const roomNumber = room.room_number?.toLowerCase() || '';
      const roomName = room.name.toLowerCase();
      const building = room.building_name.toLowerCase();
      const floor = room.floor_name.toLowerCase();

      return (
        roomNumber.includes(query) ||
        roomName.includes(query) ||
        building.includes(query) ||
        floor.includes(query)
      );
    }

    return true;
  });

  const getRoomHealthStatus = (room: typeof rooms[0]) => {
    if (room.non_functional_count > 0) return 'critical';
    if (room.maintenance_count > 0) return 'warning';
    return 'ok';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-green-600 dark:text-green-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertCircle className="h-5 w-5" />;
      case 'warning': return <AlertCircle className="h-5 w-5" />;
      default: return <CheckCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Room Monitoring</h2>
          <p className="text-muted-foreground">
            Track lighting fixtures by room
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by room number, name, floor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showIssuesOnly ? "default" : "outline"}
          onClick={() => setShowIssuesOnly(!showIssuesOnly)}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Issues Only
        </Button>
      </div>

      {/* Room List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading rooms...</p>
        </div>
      ) : !filteredRooms || filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {searchQuery || showIssuesOnly 
                ? 'No rooms found matching your criteria'
                : 'No rooms with lighting fixtures found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRooms.map((room) => {
            const status = getRoomHealthStatus(room);
            const issueCount = room.non_functional_count + room.maintenance_count;

            return (
              <Card
                key={room.id}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedRoomId(room.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        status === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                        status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <DoorOpen className={`h-5 w-5 ${getStatusColor(status)}`} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {room.room_number && (
                            <Badge variant="outline" className="font-mono">
                              {room.room_number}
                            </Badge>
                          )}
                          <h3 className="font-semibold">{room.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {room.building_name} • {room.floor_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {room.total_fixtures} fixture{room.total_fixtures !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {issueCount > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {issueCount} issue{issueCount !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                          <CheckCircle className="h-3 w-3" />
                          All OK
                        </Badge>
                      )}

                      <div className={`flex items-center gap-1 ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
