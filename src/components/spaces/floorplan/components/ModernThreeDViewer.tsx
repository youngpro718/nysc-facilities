
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import { 
  ZoomIn,
  ZoomOut,
  Home,
  Layers,
  Maximize2,
  Footprints,
  Eye
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
  onSelectedObjectType?: (type: string | null) => void;
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
  moveEnabled = false,
  onSelectedObjectType
}: ModernThreeDViewerProps) {
  const { objects, edges, isLoading } = useFloorPlanData(floorId);
  const [showConnections, setShowConnections] = useState<boolean>(true);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const [walkMode, setWalkMode] = useState(false);
  const sceneRef = useRef<SceneHandle | null>(null);

  // Typed validators and helpers
  const isValidViewerObject = (obj: any): obj is ViewerObject => {
    if (!obj || typeof obj !== 'object') return false;
    const pos = obj.position;
    const size = obj.data?.size;
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
  const filterValidEdges = (list: any[] | undefined | null): ViewerEdge[] => {
    if (!Array.isArray(list)) return [];
    return list.filter((edge: any): edge is ViewerEdge => {
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
    const base = (objects as any[]).filter(isValidViewerObject) as ViewerObject[];
    if (!filterType || filterType === 'all') return base;
    return base.filter((o: any) => (o?.type || '') === filterType);
  }, [objects, filterType]);

  const safeEdges = useMemo(() => filterValidEdges(edges as any[]), [edges]);

  // Map string-id edges to geometric connections using object positions
  const sceneConnections = useMemo(() => {
    if (!showConnections) return [] as { id: string; from: { x: number; y: number }; to: { x: number; y: number } }[];
    return safeEdges.flatMap((e) => {
      const fromObj = safeObjects.find(o => o.id === e.source);
      const toObj = safeObjects.find(o => o.id === e.target);
      if (!fromObj || !toObj) return [] as any[];
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
      if (e.key === 'Escape' && walkMode) {
        e.preventDefault();
        setWalkMode(false);
        return;
      }
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
  }, [walkMode]);

  const handleWalkModeExit = useCallback(() => {
    setWalkMode(false);
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
      {/* Walk mode toggle */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={walkMode ? 'default' : 'outline'}
                className="h-8 w-8 bg-slate-900/80 border-cyan-500/30 hover:bg-slate-800"
                onClick={() => setWalkMode(!walkMode)}
              >
                {walkMode ? <Eye className="h-4 w-4 text-cyan-400" /> : <Footprints className="h-4 w-4 text-slate-300" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{walkMode ? 'Exit Walk Mode (ESC)' : 'Walk Mode — Click to enter, WASD to move'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Walk mode instructions overlay */}
      {walkMode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-cyan-300 border border-cyan-500/20">
          Click to lock mouse • WASD to move • Mouse to look • ESC to exit
        </div>
      )}

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
          moveEnabled={moveEnabled}
          walkMode={walkMode}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
