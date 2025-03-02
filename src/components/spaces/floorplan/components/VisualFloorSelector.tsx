
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface VisualFloorSelectorProps {
  floors: any[];
  selectedFloorId: string | null;
  onFloorSelect: (floorId: string) => void;
  isLoading?: boolean;
}

export function VisualFloorSelector({
  floors,
  selectedFloorId,
  onFloorSelect,
  isLoading = false
}: VisualFloorSelectorProps) {
  // Group floors by building
  const floorsByBuilding = floors.reduce((acc: Record<string, any[]>, floor) => {
    const buildingId = floor.building_id || 'unknown';
    const buildingName = floor.buildings?.name || 'Unknown Building';
    
    if (!acc[buildingId]) {
      acc[buildingId] = [];
    }
    
    acc[buildingId].push({
      ...floor,
      buildingName
    });
    
    return acc;
  }, {});

  return (
    <Card className="h-[600px] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Floor Selection
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[500px] p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-sm text-gray-500 mt-4">Loading floors...</p>
          </div>
        ) : floors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] p-4">
            <p className="text-sm text-gray-500">No floors available</p>
          </div>
        ) : (
          <ScrollArea className="h-[530px]">
            <div className="p-4 space-y-4">
              {Object.entries(floorsByBuilding).map(([buildingId, buildingFloors]) => {
                // Ensure buildingFloors is an array before sorting
                const floorArray = Array.isArray(buildingFloors) ? buildingFloors : [];
                
                // Sort floors by floor number (descending, so highest floor first)
                const sortedFloors = [...floorArray].sort(
                  (a, b) => (b.floor_number || 0) - (a.floor_number || 0)
                );
                
                // Skip rendering if no valid floors for this building
                if (sortedFloors.length === 0) return null;
                
                return (
                  <div key={buildingId} className="space-y-2">
                    <div className="flex items-center space-x-2 py-1 px-2 rounded bg-gray-50">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <h3 className="text-sm font-medium">
                        {sortedFloors[0]?.buildingName || 'Unknown Building'}
                      </h3>
                    </div>
                    
                    <div className="ml-2 pl-4 border-l-2 border-dashed border-gray-200 space-y-1">
                      {sortedFloors.map(floor => {
                        const isSelected = floor.id === selectedFloorId;
                        const floorNumber = typeof floor.floor_number === 'number' ? floor.floor_number : 0;
                        
                        return (
                          <Button
                            key={floor.id}
                            variant={isSelected ? "default" : "ghost"}
                            size="sm"
                            className={`w-full justify-start text-left ${
                              isSelected ? "bg-primary text-primary-foreground" : "text-gray-700"
                            }`}
                            onClick={() => onFloorSelect(floor.id)}
                          >
                            <div className="flex items-center gap-2">
                              {floorNumber > 0 ? (
                                <ChevronUp className="h-3 w-3 opacity-70" />
                              ) : (
                                <ChevronDown className="h-3 w-3 opacity-70" />
                              )}
                              <span>
                                {floor.name}
                                {floorNumber > 0 && (
                                  <span className="ml-1 text-xs opacity-70">
                                    (Floor {floorNumber})
                                  </span>
                                )}
                                {floorNumber === 0 && (
                                  <span className="ml-1 text-xs opacity-70">
                                    (Ground)
                                  </span>
                                )}
                                {floorNumber < 0 && (
                                  <span className="ml-1 text-xs opacity-70">
                                    (Basement {Math.abs(floorNumber)})
                                  </span>
                                )}
                              </span>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
