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

// Minimal object shape used by the 3D viewer and scene
interface ViewerObject {
  id: string;
  type?: string;
  position: { x: number; y: number; z?: number };
  data: { size: { width: number; height: number } };
}

// Preview payload used to render temporary updates
interface PreviewData {
  id: string;
  position: { x: number; y: number };
  rotation: number;
  data: { size: { width: number; height: number }; properties: Record<string, unknown> };
}

// Optional imperative scene handle (if provided by the scene component)
interface SceneHandle {
  resetCamera: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

interface ModernThreeDViewerProps {
  floorId: string | null;
  onObjectSelect?: (objectId: string) => void;
  selectedObjectId?: string | null;
  previewData?: PreviewData;
  showLabels?: boolean;
  filterType?: 'all' | 'room' | 'hallway' | 'door';
  showConnectionsExternal?: boolean;
  commandToken?: { type: 'fit' } | { type: 'focus'; id: string } | null;
  labelScale?: number;
}

export function ModernThreeDViewer({ 
  floorId, 
  onObjectSelect, 
  selectedObjectId,
  previewData,
  showLabels = true,
  filterType = 'all',
  showConnectionsExternal,
  commandToken = null,
  labelScale = 1
}: ModernThreeDViewerProps) {
  const { objects, edges, isLoading } = useFloorPlanData(floorId);
  const [showConnections, setShowConnections] = useState<boolean>(true);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([300, 400, 300]);
  const sceneRef = useRef<SceneHandle | null>(null);

  // Typed validators and helpers
  const isValidViewerObject = (obj: any): obj is ViewerObject => {
    if (!obj || typeof obj !== 'object') return false;
    const pos = (obj as any).position;
    const size = (obj as any).data?.size;
    return (
      pos &&
      Number.isFinite(pos.x) &&
      Number.isFinite(pos.y) &&
      size &&
      Number.isFinite(size.width) &&
      Number.isFinite(size.height)
    );
  };

  type ViewerEdge = { id?: string; from: string; to: string; type?: string };
  const filterValidEdges = (list: any[] | undefined | null): ViewerEdge[] => {
    if (!Array.isArray(list)) return [];
    return list.filter((edge: any): edge is ViewerEdge => {
      return (
        edge && typeof edge === 'object' &&
        typeof edge.from === 'string' &&
        typeof edge.to === 'string' &&
        edge.from !== edge.to
      );
    });
  };

  // Safe data filtering to prevent undefined errors
  const safeObjects = useMemo<ViewerObject[]>(() => {
    if (!Array.isArray(objects)) return [];
    const base = (objects as any[]).filter(isValidViewerObject) as ViewerObject[];
    if (!filterType || filterType === 'all') return base;
    return base.filter((o: any) => (o?.type || '') === filterType);
  }, [objects, filterType]);

  const safeEdges = useMemo(() => filterValidEdges(edges as any[]), [edges]);

  // Map string-id edges to geometric connections using object positions
  const sceneConnections = useMemo(() => {
    if (!showConnections) return [] as { id: string; from: { x: number; y: number }; to: { x: number; y: number } }[];
    return safeEdges.flatMap((e) => {
      const fromObj = safeObjects.find(o => o.id === e.from);
      const toObj = safeObjects.find(o => o.id === e.to);
      if (!fromObj || !toObj) return [] as any[];
      return [{
        id: e.id ?? `${e.from}-${e.to}`,
        from: { x: fromObj.position.x, y: fromObj.position.y },
        to: { x: toObj.position.x, y: toObj.position.y }
      }];
    });
  }, [safeEdges, safeObjects, showConnections]);



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

  // Determine small screens and tune defaults for performance
  useEffect(() => {
    const update = () => {
      const small = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
      setIsSmallScreen(small);
      // Default: hide connections on small screens for clarity/perf
      if (small) setShowConnections(false);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Sync with external connections control if provided
  useEffect(() => {
    if (typeof showConnectionsExternal === 'boolean') {
      setShowConnections(showConnectionsExternal);
    }
  }, [showConnectionsExternal]);

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
          connections={sceneConnections}
          selectedObjectId={selectedObjectId}
          onObjectClick={onObjectSelect}
          showConnections={showConnections}
          // Cut shadows on small screens to improve performance
          enableShadows={!isSmallScreen}
          backgroundColor={0x1e293b}
          commandToken={commandToken}
          labelScale={labelScale}
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
