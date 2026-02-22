// @ts-nocheck
import { useEffect, useState, useRef, useMemo } from 'react';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import { 
  ZoomIn,
  ZoomOut,
  Home,
  Layers,
  Maximize2
} from 'lucide-react';
import NewThreeDScene, { SceneHandle } from '../three-d/NewThreeDScene';
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
  data: { 
    size: { width: number; height: number };
    label?: string;
    type?: string;
    properties?: Record<string, unknown>;
  };
}

// Preview payload used to render temporary updates
interface PreviewData {
  id: string;
  position: { x: number; y: number };
  rotation: number;
  data: { size: { width: number; height: number }; properties: Record<string, unknown> };
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
  moveEnabled?: boolean;
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
  labelScale = 1,
  moveEnabled = false
}: ModernThreeDViewerProps) {
  const { objects, edges, isLoading } = useFloorPlanData(floorId);
  const [showConnections, setShowConnections] = useState<boolean>(true);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const sceneRef = useRef<SceneHandle | null>(null);

  // Typed validators and helpers
  const isValidViewerObject = (obj: Record<string, unknown>): obj is ViewerObject => {
    if (!obj || typeof obj !== 'object') return false;
    const pos = ((obj as Record<string, unknown>)).position;
    const size = ((obj as Record<string, unknown>)).data?.size;
    return (
      pos &&
      Number.isFinite(pos.x) &&
      Number.isFinite(pos.y) &&
      size &&
      Number.isFinite(size.width) &&
      Number.isFinite(size.height)
    );
  };

  type ViewerEdge = { id?: string; source: string; target: string; type?: string };
  const filterValidEdges = (list: unknown[] | undefined | null): ViewerEdge[] => {
    if (!Array.isArray(list)) return [];
    return list.filter((edge: Record<string, unknown>): edge is ViewerEdge => {
      return (
        edge && typeof edge === 'object' &&
        typeof edge.source === 'string' &&
        typeof edge.target === 'string' &&
        edge.source !== edge.target
      );
    });
  };

  // Safe data filtering to prevent undefined errors
  const safeObjects = useMemo<ViewerObject[]>(() => {
    if (!Array.isArray(objects)) return [];
    const base = (objects as unknown[]).filter(isValidViewerObject) as ViewerObject[];
    if (!filterType || filterType === 'all') return base;
    return base.filter((o: Record<string, unknown>) => (o?.type || '') === filterType);
  }, [objects, filterType]);

  const safeEdges = useMemo(() => filterValidEdges(edges as unknown[]), [edges]);

  // Map string-id edges to geometric connections using object positions
  const sceneConnections = useMemo(() => {
    if (!showConnections) return [] as { id: string; from: { x: number; y: number }; to: { x: number; y: number } }[];
    return safeEdges.flatMap((e) => {
      const fromObj = safeObjects.find(o => o.id === e.source);
      const toObj = safeObjects.find(o => o.id === e.target);
      if (!fromObj || !toObj) return [] as unknown[];
      return [{
        id: e.id ?? `${e.source}-${e.target}`,
        from: { x: fromObj.position.x, y: fromObj.position.y },
        to: { x: toObj.position.x, y: toObj.position.y },
        type: e.type || 'standard'
      }];
    });
  }, [safeEdges, safeObjects, showConnections]);

  const handleResetCamera = () => {
    sceneRef.current?.resetCamera();
  };

  const handleZoomIn = () => {
    sceneRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    sceneRef.current?.zoomOut();
  };

  const handleFitToContent = () => {
    sceneRef.current?.fitToContent();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Home') {
        e.preventDefault();
        handleResetCamera();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine small screens and tune defaults for performance
  useEffect(() => {
    const update = () => {
      const small = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
      setIsSmallScreen(small);
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
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400/30 border-t-cyan-400 mx-auto mb-4"></div>
          <p className="text-lg text-cyan-300 font-medium">Loading 3D floor plan...</p>
          <p className="text-sm text-slate-400 mt-1">Preparing visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Enhanced Floating Controls */}
      <div className="absolute top-6 right-6 z-10">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-cyan-500/20">
          <TooltipProvider>
            <div className="flex flex-col gap-2">
              {/* Camera Controls Group */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-cyan-400 px-2 mb-2">Camera</div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl bg-slate-800/50 hover:bg-cyan-900/30 hover:text-cyan-400 text-slate-300 transition-all duration-200"
                      onClick={handleResetCamera}
                    >
                      <Home className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-800 text-white text-xs rounded-lg border-slate-700">
                    Reset Camera (Home)
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl bg-slate-800/50 hover:bg-green-900/30 hover:text-green-400 text-slate-300 transition-all duration-200"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-800 text-white text-xs rounded-lg border-slate-700">
                    Zoom In (+)
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl bg-slate-800/50 hover:bg-orange-900/30 hover:text-orange-400 text-slate-300 transition-all duration-200"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-800 text-white text-xs rounded-lg border-slate-700">
                    Zoom Out (-)
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl bg-slate-800/50 hover:bg-purple-900/30 hover:text-purple-400 text-slate-300 transition-all duration-200"
                      onClick={handleFitToContent}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-800 text-white text-xs rounded-lg border-slate-700">
                    Fit to Content
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Separator */}
              <div className="h-px bg-slate-700 mx-2"></div>

              {/* Display Controls Group */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-cyan-400 px-2 mb-2">Display</div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all duration-200",
                        showConnections 
                          ? "bg-purple-900/50 text-purple-400 shadow-lg shadow-purple-500/20" 
                          : "bg-slate-800/50 hover:bg-purple-900/30 hover:text-purple-400 text-slate-300"
                      )}
                      onClick={() => setShowConnections(!showConnections)}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-slate-800 text-white text-xs rounded-lg border-slate-700">
                    {showConnections ? 'Hide' : 'Show'} Connections
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* 3D Scene */}
      <div className="flex-1 h-full">
        <NewThreeDScene
          ref={sceneRef}
          objects={safeObjects}
          connections={sceneConnections}
          selectedObjectId={selectedObjectId}
          onObjectClick={onObjectSelect}
          showConnections={showConnections}
          enableShadows={!isSmallScreen}
          backgroundColor={0x0f172a}
          commandToken={commandToken}
          labelScale={labelScale}
          className="w-full h-full"
        />
      </div>

      {/* Enhanced Info Overlay */}
      {safeObjects.length > 0 && (
        <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-900/30 rounded-lg">
              <Layers className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-100">
                {safeObjects.length} {safeObjects.length === 1 ? 'Space' : 'Spaces'}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                  <span>{safeObjects.filter(obj => obj.type === 'room').length} Rooms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-violet-500 rounded-full shadow-lg shadow-violet-500/50"></div>
                  <span>{safeObjects.filter(obj => obj.type === 'hallway').length} Hallways</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
