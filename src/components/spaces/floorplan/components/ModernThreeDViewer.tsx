import { useEffect, useState, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import { toast } from 'sonner';
import { 
  Eye, 
  EyeOff, 
  Settings, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Home,
  Layers
} from 'lucide-react';
import NewThreeDScene from '../three-d/NewThreeDScene';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface ModernThreeDViewerProps {
  floorId: string | null;
  onObjectSelect?: (object: any) => void;
  selectedObjectId?: string | null;
  previewData?: any;
  showLabels?: boolean;
}

export function ModernThreeDViewer({ 
  floorId, 
  onObjectSelect, 
  selectedObjectId,
  previewData,
  showLabels = true
}: ModernThreeDViewerProps) {
  const { objects, edges, isLoading } = useFloorPlanData(floorId);
  const [showConnections, setShowConnections] = useState<boolean>(true);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([300, 400, 300]);
  const sceneRef = useRef<any>(null);

  // Safe data filtering to prevent undefined errors
  const safeObjects = useMemo(() => {
    if (!objects) {
      console.log('ModernThreeDViewer - No objects provided');
      return [];
    }
    
    console.log('ModernThreeDViewer - Raw objects received:', objects.length);
    
    const filtered = objects.filter(obj => {
      const isValid = obj && 
        typeof obj === 'object' && 
        obj.position && 
        obj.data && 
        obj.data.size &&
        typeof obj.position.x === 'number' && 
        typeof obj.position.y === 'number' &&
        typeof obj.data.size.width === 'number' &&
        typeof obj.data.size.height === 'number';
      
      if (!isValid) {
        console.log('ModernThreeDViewer - Filtered out object:', {
          hasObj: !!obj,
          hasPosition: !!obj?.position,
          hasData: !!obj?.data,
          hasSize: !!obj?.data?.size,
          positionX: obj?.position?.x,
          positionY: obj?.position?.y,
          sizeWidth: obj?.data?.size?.width,
          sizeHeight: obj?.data?.size?.height,
          obj: obj
        });
      }
      
      return isValid;
    });
    
    console.log('ModernThreeDViewer - Safe objects after filtering:', filtered.length);
    console.log('ModernThreeDViewer - First safe object:', filtered[0]);
    
    return filtered;
  }, [objects]);

  const safeEdges = useMemo(() => {
    if (!edges) return [];
    
    return edges.filter(edge => 
      edge && 
      typeof edge === 'object' &&
      (edge as any).from && 
      (edge as any).to &&
      (edge as any).from !== (edge as any).to
    );
  }, [edges]);



  const handleResetCamera = () => {
    setCameraPosition([300, 400, 300]);
    if (sceneRef.current) {
      sceneRef.current.resetCamera();
    }
  };

  const handleZoomIn = () => {
    if (sceneRef.current) {
      sceneRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (sceneRef.current) {
      sceneRef.current.zoomOut();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-slate-600 dark:text-slate-300">Loading 3D floor plan...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="h-full relative">
      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <TooltipProvider>
          <div className="flex flex-col space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                  onClick={handleResetCamera}
                >
                  <Home className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Camera</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                  onClick={handleZoomIn}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                  onClick={handleZoomOut}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                    showConnections && "bg-primary/20"
                  )}
                  onClick={() => setShowConnections(!showConnections)}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showConnections ? 'Hide' : 'Show'} Connections</TooltipContent>
            </Tooltip>


          </div>
        </TooltipProvider>
      </div>

      {/* 3D Scene */}
      <div className="flex-1">
        <NewThreeDScene
          objects={safeObjects}
          connections={safeEdges}
          selectedObjectId={selectedObjectId}
          onObjectClick={onObjectSelect}
          showConnections={showConnections}
          enableShadows={true}
          backgroundColor={0x1e293b}
          className="w-full h-full"
        />
      </div>

      {/* Info Overlay */}
      {safeObjects.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-xs">
            <p className="font-medium">{safeObjects.length} objects</p>
            <p className="text-slate-600 dark:text-slate-300">
              {safeObjects.filter(obj => obj.type === 'room').length} rooms
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
