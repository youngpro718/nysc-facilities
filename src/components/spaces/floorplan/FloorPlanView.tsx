
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Move, Eye } from "lucide-react";
import { useState } from "react";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { PropertiesPanel } from "./components/PropertiesPanel";

interface FloorPlanViewProps {
  selectedFloor: string;
  selectedBuilding: string;
}

export function FloorPlanView({ selectedFloor, selectedBuilding }: FloorPlanViewProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedObject, setSelectedObject] = useState<any>(null);

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
      
      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <FloorPlanCanvas 
          floorId={selectedFloor === 'all' ? null : selectedFloor}
          zoom={zoom}
          onObjectSelect={handleObjectSelect}
        />
        
        <PropertiesPanel 
          selectedObject={selectedObject}
          onUpdate={() => {
            setSelectedObject(null);
          }}
        />
      </div>
    </div>
  );
}
