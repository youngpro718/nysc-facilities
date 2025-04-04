
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon, RotateCcw } from "lucide-react";
import ThreeDScene from "../three-d/ThreeDScene";

export interface ThreeDViewerProps {
  floorId: string;
  selectedObjectId?: string;
  previewData?: any;
  onObjectSelect?: (object: any) => void;
}

export function ThreeDViewer({
  floorId,
  selectedObjectId,
  previewData,
  onObjectSelect
}: ThreeDViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-card mb-2 p-2 rounded-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8"
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
          <span className="text-xs min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showLabels ? "default" : "outline"}
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
          >
            Labels
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-muted/40 rounded-md overflow-hidden relative">
        <Tabs defaultValue="3d" className="h-full">
          <TabsList className="absolute top-2 right-2 z-10">
            <TabsTrigger value="3d">3D View</TabsTrigger>
            <TabsTrigger value="2d">2D View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="3d" className="h-full">
            <ThreeDScene 
              floorId={floorId}
              selectedObjectId={selectedObjectId}
              zoom={zoom}
              showLabels={showLabels}
              previewData={previewData}
              onObjectSelect={onObjectSelect}
            />
          </TabsContent>
          
          <TabsContent value="2d" className="h-full">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                2D view is currently unavailable. Please use the 3D view.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ThreeDViewer;
