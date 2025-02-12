
import { useState } from "react";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoomIn, ZoomOut, RotateCcw, Move, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PropertiesPanel } from "./components/PropertiesPanel";

export function FloorPlanView() {
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedObject, setSelectedObject] = useState<any>(null);

  const { data: floors, isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select(`
          id,
          name,
          floor_number,
          buildings:building_id (
            name
          )
        `)
        .order('floor_number');
      
      if (error) throw error;
      return data;
    }
  });

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  const handleObjectSelect = (obj: any) => {
    setSelectedObject(obj);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedFloorId || ""} onValueChange={setSelectedFloorId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a floor" />
            </SelectTrigger>
            <SelectContent>
              {floors?.map((floor) => (
                <SelectItem key={floor.id} value={floor.id}>
                  {floor.buildings?.name} - {floor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-x-2">
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Move className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <FloorPlanCanvas 
          floorId={selectedFloorId} 
          zoom={zoom}
          onObjectSelect={handleObjectSelect}
        />
        
        <PropertiesPanel 
          selectedObject={selectedObject}
          onUpdate={() => {
            // Refresh the floor plan when properties are updated
            setSelectedObject(null);
          }}
        />
      </div>
    </div>
  );
}
