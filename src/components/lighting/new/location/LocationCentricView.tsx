import React, { useState } from 'react';
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
import { EnhancedHallwayLightingPage } from '../../enhanced/EnhancedHallwayLightingPage';

export function LocationCentricView() {
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());

  // Mock data for hierarchical structure
  const buildingStructure = [
    {
      id: 'building-1',
      name: 'Main Building',
      floors: [
        {
          id: 'floor-13',
          number: 13,
          name: '13th Floor',
          hasSpecialConfig: true,
          elevatorBanks: 2,
          hallways: [
            {
              id: 'hall-13-main',
              name: 'Main Hallway',
              section: 'main',
              fixtures: 15,
              functional: 14,
              status: 'good'
            },
            {
              id: 'hall-13-ne',
              name: 'North East',
              section: 'north_east',
              fixtures: 8,
              functional: 8,
              status: 'excellent'
            },
            {
              id: 'hall-13-elevator1',
              name: 'Elevator Bank 1',
              section: 'center_east',
              fixtures: 3,
              functional: 3,
              status: 'excellent'
            }
          ],
          rooms: [
            { id: 'room-1301', name: 'Room 1301', fixtures: 4, functional: 4 },
            { id: 'room-1302', name: 'Room 1302', fixtures: 6, functional: 5 }
          ]
        },
        {
          id: 'floor-14',
          number: 14,
          name: '14th Floor',
          hasSpecialConfig: false,
          elevatorBanks: 2,
          hallways: [
            {
              id: 'hall-14-main',
              name: 'Main Hallway',
              section: 'main',
              fixtures: 15,
              functional: 15,
              status: 'excellent'
            }
          ],
          rooms: [
            { id: 'room-1401', name: 'Room 1401', fixtures: 4, functional: 4 }
          ]
        },
        {
          id: 'floor-17',
          number: 17,
          name: '17th Floor',
          hasSpecialConfig: false,
          elevatorBanks: 0,
          hallways: [
            {
              id: 'hall-17-main',
              name: 'Main Hallway',
              section: 'main',
              fixtures: 15,
              functional: 13,
              status: 'fair'
            }
          ],
          rooms: []
        }
      ]
    }
  ];

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
    const floor = buildingStructure[0].floors.find(f => f.id === selectedFloor);
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
                          {floor.hallways.length} hallways • {floor.rooms.length} rooms
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