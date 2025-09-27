import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Building, 
  ChevronDown, 
  ChevronRight,
  MapPin,
  Route,
  Lightbulb,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EnhancedHallwayLightingPage } from '../../enhanced/EnhancedHallwayLightingPage';

export function LocationCentricView() {
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());

  // Fetch real building and lighting data
  const { data: buildingData, isLoading, error } = useQuery({
    queryKey: ['location-centric-lighting'],
    queryFn: async () => {
      console.log("Starting data fetch with separate queries...");
      
      try {
        // Step 1: Fetch buildings
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('id, name, status')
          .eq('status', 'active')
          .order('name');

        if (buildingsError) throw buildingsError;
        if (!buildingsData?.length) return [];

        console.log("Buildings fetched:", buildingsData.length);

        // Step 2: Fetch floors for all buildings
        const buildingIds = buildingsData.map(b => b.id);
        const { data: floorsData, error: floorsError } = await supabase
          .from('floors')
          .select('id, name, floor_number, building_id')
          .in('building_id', buildingIds)
          .order('building_id, floor_number');

        if (floorsError) throw floorsError;
        console.log("Floors fetched:", floorsData?.length || 0);

        // Step 3: Fetch unified_spaces for all floors
        const floorIds = floorsData?.map(f => f.id) || [];
        const { data: spacesData, error: spacesError } = floorIds.length > 0 
          ? await supabase
              .from('unified_spaces')
              .select('id, name, type, floor_id')
              .in('floor_id', floorIds)
          : { data: [], error: null };

        if (spacesError) throw spacesError;
        console.log("Spaces fetched:", spacesData?.length || 0);

        // Step 4: Fetch lighting fixtures for all spaces
        const spaceIds = spacesData?.map(s => s.id) || [];
        const { data: fixturesData, error: fixturesError } = spaceIds.length > 0
          ? await supabase
              .from('lighting_fixtures')
              .select('id, name, status, space_id, space_type')
              .in('space_id', spaceIds)
          : { data: [], error: null };

        if (fixturesError) throw fixturesError;
        console.log("Fixtures fetched:", fixturesData?.length || 0);

        // Step 5: Manually join the data
        const result = buildingsData.map(building => {
          const buildingFloors = (floorsData || [])
            .filter(floor => floor.building_id === building.id)
            .map(floor => {
              const floorSpaces = (spacesData || [])
                .filter(space => space.floor_id === floor.id)
                .map(space => ({
                  ...space,
                  lighting_fixtures: (fixturesData || [])
                    .filter(fixture => fixture.space_id === space.id)
                }));

              return {
                ...floor,
                unified_spaces: floorSpaces
              };
            });

          return {
            ...building,
            floors: buildingFloors
          };
        });

        console.log("Final result:", result);
        return result;
      } catch (error) {
        console.error('Error in data fetching:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('LocationCentricView error:', error);
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load building and floor data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform data for UI
  const buildingStructure = (buildingData || []).map(building => {
    console.log('Processing building:', building.name, 'floors:', building.floors?.length);
    
    return {
      id: building.id,
      name: building.name,
      floors: (building.floors || [])
        .sort((a, b) => a.floor_number - b.floor_number)
        .map(floor => {
          const spaces = floor.unified_spaces || [];
          const hallways = spaces.filter(s => s.type === 'hallway');
          const rooms = spaces.filter(s => s.type === 'room');
          
          const floorFixtures = spaces.flatMap(s => s.lighting_fixtures || []);
          const hallwayFixtures = hallways.flatMap(h => h.lighting_fixtures || []);
          const roomFixtures = rooms.flatMap(r => r.lighting_fixtures || []);
          
          console.log(`Floor ${floor.floor_number}:`, {
            spaces: spaces.length,
            hallways: hallways.length,
            rooms: rooms.length,
            fixtures: floorFixtures.length
          });
          
          return {
            id: floor.id,
            number: floor.floor_number,
            name: floor.name,
            hasSpecialConfig: [13, 16, 17].includes(floor.floor_number),
            elevatorBanks: floor.floor_number === 17 ? 0 : 2,
            totalFixtures: floorFixtures.length,
            functionalFixtures: floorFixtures.filter(f => f.status === 'functional').length,
            hallways: hallways.map(hallway => {
              const fixtures = hallway.lighting_fixtures || [];
              const functional = fixtures.filter(f => f.status === 'functional').length;
              
              return {
                id: hallway.id,
                name: hallway.name,
                section: 'main',
                fixtures: fixtures.length,
                functional,
                status: functional === fixtures.length ? 'excellent' : 
                       functional >= fixtures.length * 0.8 ? 'good' : 
                       functional >= fixtures.length * 0.5 ? 'fair' : 'poor'
              };
            }),
            rooms: rooms.map(room => {
              const fixtures = room.lighting_fixtures || [];
              const functional = fixtures.filter(f => f.status === 'functional').length;
              
              return {
                id: room.id,
                name: room.name,
                fixtures: fixtures.length,
                functional
              };
            })
          };
        })
    };
  });

  console.log('Final building structure:', buildingStructure);

  const toggleFloor = (floorId: string) => {
    const newExpanded = new Set(expandedFloors);
    if (newExpanded.has(floorId)) {
      newExpanded.delete(floorId);
    } else {
      newExpanded.add(floorId);
    }
    setExpandedFloors(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedFloor) {
    const floor = buildingStructure.flatMap(b => b.floors).find(f => f.id === selectedFloor);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedFloor(null)}>
            ← Back to Overview
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{floor?.name} Lighting Management</h2>
            <p className="text-muted-foreground">Detailed hallway and room lighting control</p>
          </div>
        </div>
        <EnhancedHallwayLightingPage />
      </div>
    );
  }

  if (!buildingStructure || buildingStructure.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Location-Based Lighting Management</h2>
          <p className="text-muted-foreground">
            Navigate through floors, hallways, and rooms in hierarchical view
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No buildings found or no floors configured.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Location-Based Lighting Management</h2>
          <p className="text-muted-foreground">
            Navigate through floors, hallways, and rooms in hierarchical view
          </p>
        </div>
      </div>

      {buildingStructure.map((building) => (
        <Card key={building.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {building.name}
              <Badge variant="outline">
                {building.floors.length} floors
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {building.floors.map((floor) => (
              <Collapsible
                key={floor.id}
                open={expandedFloors.has(floor.id)}
                onOpenChange={() => toggleFloor(floor.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      {expandedFloors.has(floor.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{floor.name}</span>
                          {floor.hasSpecialConfig && (
                            <Badge variant="secondary">Special Config</Badge>
                          )}
                          {floor.elevatorBanks === 0 && (
                            <Badge variant="outline">No Elevators</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {floor.hallways.length} hallways • {floor.rooms.length} rooms • {floor.totalFixtures} fixtures
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {floor.functionalFixtures}/{floor.totalFixtures} functional
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFloor(floor.id);
                        }}
                      >
                        Manage Floor
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {/* Hallways */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Route className="h-4 w-4" />
                        Hallways
                      </h4>
                      {floor.hallways.map((hallway) => (
                        <div key={hallway.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{hallway.name}</span>
                            <Badge className={getStatusColor(hallway.status)}>
                              {hallway.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {hallway.functional}/{hallway.fixtures} fixtures functional
                          </div>
                          {hallway.functional < hallway.fixtures && (
                            <div className="flex items-center gap-1 mt-1 text-amber-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs">
                                {hallway.fixtures - hallway.functional} need attention
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Rooms */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Rooms
                      </h4>
                      {floor.rooms.length > 0 ? (
                        floor.rooms.map((room) => (
                          <div key={room.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{room.name}</span>
                              <Lightbulb className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {room.functional}/{room.fixtures} fixtures functional
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          No rooms configured for this floor
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}