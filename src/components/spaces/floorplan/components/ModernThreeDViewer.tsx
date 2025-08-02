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
      {/* Enhanced Floating Controls */}
      <div className="absolute top-6 right-6 z-10">
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-white/20 dark:border-slate-700/50">
          <TooltipProvider>
            <div className="flex flex-col gap-2">
              {/* Camera Controls Group */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2 mb-2">Camera</div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                      onClick={handleResetCamera}
                    >
                      <Home className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-900 text-white text-xs rounded-lg">
                    Reset Camera
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-900 text-white text-xs rounded-lg">
                    Zoom In
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-900 text-white text-xs rounded-lg">
                    Zoom Out
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Separator */}
              <div className="h-px bg-slate-200 dark:bg-slate-600 mx-2"></div>

              {/* Display Controls Group */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2 mb-2">Display</div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all duration-200",
                        showConnections 
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shadow-sm" 
                          : "hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400"
                      )}
                      onClick={() => setShowConnections(!showConnections)}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-900 text-white text-xs rounded-lg">
                    {showConnections ? 'Hide' : 'Show'} Connections
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>
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

      {/* Enhanced Info Overlay */}
      {safeObjects.length > 0 && (
        <div className="absolute bottom-6 left-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/20 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <Layers className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {safeObjects.length} Objects
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {safeObjects.filter(obj => obj.type === 'room').length} Rooms
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {safeObjects.filter(obj => obj.type === 'hallway').length} Hallways
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
