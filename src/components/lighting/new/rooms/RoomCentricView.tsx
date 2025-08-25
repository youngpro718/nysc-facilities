import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { RoomLightingSummary } from "../types";
import { 
  Search, 
  MapPin, 
  Lightbulb, 
  AlertTriangle, 
  Calendar, 
  CheckCircle,
  Building,
  ArrowRight
} from "lucide-react";

export function RoomCentricView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');

  const { data: roomSummaries, isLoading } = useQuery({
    queryKey: ['room-lighting-summaries'],
    queryFn: async (): Promise<RoomLightingSummary[]> => {
      const { data: fixtures, error } = await supabase
        .from('lighting_fixtures')
        .select(`
          id,
          name,
          status,
          requires_electrician,
          ballast_issue,
          updated_at
        `);

      if (error) throw error;

      // Group fixtures by name (simplified)
      const roomMap = new Map<string, any>();
      
      fixtures?.forEach(fixture => {
        const roomKey = fixture.name || 'Unknown Room';
        
        if (!roomMap.has(roomKey)) {
          roomMap.set(roomKey, {
            room_id: fixture.id,
            room_name: fixture.name || 'Unknown Room',
            room_number: 'N/A',
            building_name: 'Unknown Building',
            floor_name: 'Unknown Floor',
            fixtures: []
          });
        }
        
        roomMap.get(roomKey).fixtures.push(fixture);
      });

      // Convert to summaries with health scores
      return Array.from(roomMap.values()).map(room => {
        const totalFixtures = room.fixtures.length;
        const functionalFixtures = room.fixtures.filter((f: any) => f.status === 'functional').length;
        const issuesCount = room.fixtures.filter((f: any) => 
          f.status === 'non_functional' || f.requires_electrician || f.ballast_issue
        ).length;
        const maintenanceNeeded = room.fixtures.filter((f: any) => 
          f.status === 'maintenance_needed'
        ).length;
        
        const healthScore = totalFixtures > 0 
          ? Math.round(((functionalFixtures / totalFixtures) * 100))
          : 100;

        return {
          room_id: room.room_id,
          room_name: room.room_name,
          room_number: room.room_number,
          building_name: room.building_name,
          floor_name: room.floor_name,
          total_fixtures: totalFixtures,
          functional_fixtures: functionalFixtures,
          issues_count: issuesCount,
          maintenance_needed: maintenanceNeeded,
          health_score: healthScore,
          last_inspection: room.fixtures[0]?.updated_at,
          next_maintenance: undefined // Would come from maintenance schedule
        };
      }).sort((a, b) => {
        // Sort by health score (worst first) then by issues count
        if (a.health_score !== b.health_score) {
          return a.health_score - b.health_score;
        }
        return b.issues_count - a.issues_count;
      });
    }
  });

  const filteredRooms = useMemo(() => {
    if (!roomSummaries) return [];
    
    return roomSummaries.filter(room => {
      const matchesSearch = searchQuery === '' || 
        room.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.building_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBuilding = selectedBuilding === 'all' || 
        room.building_name === selectedBuilding;
      
      return matchesSearch && matchesBuilding;
    });
  }, [roomSummaries, searchQuery, selectedBuilding]);

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityBadge = (room: RoomLightingSummary) => {
    if (room.issues_count > 3) return { text: 'Critical', color: 'bg-red-100 text-red-800' };
    if (room.issues_count > 1) return { text: 'High', color: 'bg-orange-100 text-orange-800' };
    if (room.issues_count > 0) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Good', color: 'bg-green-100 text-green-800' };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms by name, number, or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredRooms.length}</div>
              <div className="text-sm text-muted-foreground">Total Rooms</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredRooms.filter(r => r.issues_count > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Need Attention</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredRooms.filter(r => r.health_score >= 90).length}
              </div>
              <div className="text-sm text-muted-foreground">Excellent Health</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {filteredRooms.reduce((sum, r) => sum + r.total_fixtures, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Fixtures</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Cards */}
      <div className="space-y-4">
        {filteredRooms.map((room) => {
          const priority = getPriorityBadge(room);
          
          return (
            <Card key={room.room_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{room.room_name}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          Room {room.room_number} • {room.building_name} • {room.floor_name}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={priority.color}>
                      {priority.text}
                    </Badge>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getHealthColor(room.health_score).split(' ')[0]}`}>
                        {room.health_score}%
                      </div>
                      <div className="text-xs text-muted-foreground">Health</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Health Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Lighting Health</span>
                      <span>{room.functional_fixtures} of {room.total_fixtures} functional</span>
                    </div>
                    <Progress value={room.health_score} className="h-2" />
                  </div>
                  
                  {/* Fixtures Summary */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-semibold">{room.functional_fixtures}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Functional</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-center gap-1 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-semibold">{room.issues_count}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Issues</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-center gap-1 text-yellow-600">
                        <Calendar className="h-4 w-4" />
                        <span className="font-semibold">{room.maintenance_needed}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Maintenance</div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Lightbulb className="h-4 w-4 mr-1" />
                      Manage Fixtures
                    </Button>
                    
                    {room.issues_count > 0 && (
                      <Button size="sm" className="flex-1">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Report Issue
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredRooms.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium mb-2">No rooms found</div>
            <div className="text-muted-foreground">
              Try adjusting your search criteria
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}