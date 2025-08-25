import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Lightbulb, 
  Search,
  Eye,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Building,
  Layers
} from "lucide-react";
import { fetchLightingFixtures } from "@/services/supabase";
import { LightStatus } from "@/types/lighting";

interface RoomData {
  id: string;
  name: string;
  building: string;
  floor: string;
  fixtures: Array<{
    id: string;
    name: string;
    status: LightStatus;
    type: string;
  }>;
}

export function RoomManagementView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: fetchLightingFixtures,
  });

  // Group fixtures by room
  const roomData: RoomData[] = fixtures?.reduce((acc: RoomData[], fixture) => {
    const roomId = `${fixture.building_name}-${fixture.floor_name}-${fixture.space_name || fixture.room_number || 'Unknown'}`;
    const roomName = fixture.space_name || fixture.room_number || 'Unknown Room';
    const building = fixture.building_name || 'Unknown Building';
    const floor = fixture.floor_name || 'Unknown Floor';

    let room = acc.find(r => r.id === roomId);
    if (!room) {
      room = {
        id: roomId,
        name: roomName,
        building,
        floor,
        fixtures: []
      };
      acc.push(room);
    }

    room.fixtures.push({
      id: fixture.id,
      name: fixture.name,
      status: fixture.status as LightStatus,
      type: fixture.type
    });

    return acc;
  }, []) || [];

  // Filter rooms
  const filteredRooms = roomData.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBuilding = !selectedBuilding || room.building === selectedBuilding;
    return matchesSearch && matchesBuilding;
  });

  // Get unique buildings
  const buildings = [...new Set(roomData.map(room => room.building))];

  const getRoomStatus = (fixtures: RoomData['fixtures']) => {
    const nonFunctional = fixtures.filter(f => f.status === 'non_functional' || f.status === 'scheduled_replacement').length;
    const needsMaintenance = fixtures.filter(f => f.status === 'maintenance_needed').length;
    
    if (nonFunctional > 0) return { status: 'critical', label: 'Issues', color: 'destructive' };
    if (needsMaintenance > 0) return { status: 'warning', label: 'Maintenance', color: 'secondary' };
    return { status: 'good', label: 'Good', color: 'default' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Wrench className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md"
        >
          <option value="">All Buildings</option>
          {buildings.map(building => (
            <option key={building} value={building}>{building}</option>
          ))}
        </select>
      </div>

      {/* Stats summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{filteredRooms.length}</p>
                <p className="text-xs text-muted-foreground">Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{buildings.length}</p>
                <p className="text-xs text-muted-foreground">Buildings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredRooms.reduce((sum, room) => sum + room.fixtures.length, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Fixtures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {filteredRooms.filter(room => getRoomStatus(room.fixtures).status === 'critical').length}
                </p>
                <p className="text-xs text-muted-foreground">Rooms with Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms grid */}
      {filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedBuilding ? 'Try adjusting your filters' : 'No rooms with fixtures exist yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => {
            const roomStatus = getRoomStatus(room.fixtures);
            const functionalCount = room.fixtures.filter(f => f.status === 'functional').length;
            
            return (
              <Card key={room.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {room.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {room.building}
                        <span className="mx-1">•</span>
                        <Layers className="h-3 w-3" />
                        {room.floor}
                      </p>
                    </div>
                    <Badge variant={roomStatus.color as any}>
                      {getStatusIcon(roomStatus.status)}
                      {roomStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fixtures:</span>
                    <span className="font-medium">{room.fixtures.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Functional:</span>
                    <span className="font-medium text-green-600">
                      {functionalCount}/{room.fixtures.length}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Wrench className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
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