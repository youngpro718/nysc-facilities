
import { useEffect, useRef } from "react";
import { useFloorPlanData } from "../hooks/useFloorPlanData";
import { ThreeDScene } from "../three-d/ThreeDScene";

export interface ThreeDViewerProps {
  floorId: string | null;
  selectedObjectId?: string | null;
  previewData?: any;
  onObjectSelect?: (object: any) => void;
}

export function ThreeDViewer({ 
  floorId, 
  selectedObjectId,
  previewData,
  onObjectSelect
}: ThreeDViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { objects, layers, isLoading } = useFloorPlanData(floorId);

  if (isLoading || !floorId) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading 3D view...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <ThreeDScene
        objects={objects}
        selectedObjectId={selectedObjectId}
        previewData={previewData}
        onSelectObject={onObjectSelect}
      />
    </div>
  );
}
