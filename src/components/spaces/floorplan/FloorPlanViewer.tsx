/**
 * FloorPlanViewer - Complete Redesign
 * 
 * A modern, practical floor plan viewer with:
 * - Clean split-view layout (canvas + sidebar)
 * - Unified toolbar with all controls
 * - Smooth 2D/3D toggle
 * - Responsive design
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFloorPlanData } from './hooks/useFloorPlanData';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icons
import {
  Building2,
  Layers,
  Box,
  Square,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Eye,
  EyeOff,
  Grid3X3,
  Move,
  MousePointer2,
  ChevronRight,
  ChevronLeft,
  Info,
  Settings2,
  Download,
  Loader2,
} from 'lucide-react';

// Sub-components
import { FloorPlan2DCanvas } from './FloorPlan2DCanvas';
import { FloorPlan3DCanvas } from './FloorPlan3DCanvas';
import { FloorPlanSidebar } from './FloorPlanSidebar';

interface Floor {
  id: string;
  floor_number: number;
  name: string;
  buildings: { name: string };
}

export function FloorPlanViewer() {
  const { user, isLoading: authLoading } = useAuth();
  
  // Core state
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isLoadingFloors, setIsLoadingFloors] = useState(true);
  
  // View state
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [fitViewTrigger, setFitViewTrigger] = useState(0);
  
  // Selection state
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'room' | 'hallway' | 'door'>('all');
  
  // Zoom state
  const [zoom, setZoom] = useState(1);

  // Fetch floor plan data
  const { objects, edges, isLoading: isLoadingData } = useFloorPlanData(selectedFloorId);

  // Fetch floors on mount
  useEffect(() => {
    const fetchFloors = async () => {
      if (authLoading) return;
      
      setIsLoadingFloors(true);
      try {
        const { data, error } = await supabase
          .from('floors')
          .select('*, buildings!floors_building_id_fkey(name)')
          .order('floor_number', { ascending: false });

        if (error) throw error;

        const formattedFloors = (data || []).map((f: any) => ({
          ...f,
          buildings: Array.isArray(f.buildings) ? f.buildings[0] : f.buildings
        }));

        setFloors(formattedFloors);
        
        if (formattedFloors.length > 0 && !selectedFloorId) {
          setSelectedFloorId(formattedFloors[0].id);
        }
      } catch (error) {
        console.error('Error fetching floors:', error);
        toast.error('Failed to load floors');
      } finally {
        setIsLoadingFloors(false);
      }
    };

    fetchFloors();
  }, [authLoading, user]);

  // Filter objects based on search and type
  const filteredObjects = useMemo(() => {
    if (!objects) return [];
    
    return objects.filter((obj: any) => {
      // Type filter
      if (filterType !== 'all' && obj.type !== filterType) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = (obj.data?.label || obj.name || '').toLowerCase();
        const roomNumber = (obj.data?.properties?.room_number || '').toLowerCase();
        return name.includes(query) || roomNumber.includes(query);
      }
      
      return true;
    });
  }, [objects, filterType, searchQuery]);

  // Get current floor info
  const currentFloor = useMemo(() => 
    floors.find(f => f.id === selectedFloorId),
    [floors, selectedFloorId]
  );

  // Get selected object
  const selectedObject = useMemo(() => 
    objects?.find((obj: any) => obj.id === selectedObjectId),
    [objects, selectedObjectId]
  );

  // Stats
  const stats = useMemo(() => ({
    total: objects?.length || 0,
    rooms: objects?.filter((o: any) => o.type === 'room').length || 0,
    hallways: objects?.filter((o: any) => o.type === 'hallway').length || 0,
    doors: objects?.filter((o: any) => o.type === 'door').length || 0,
  }), [objects]);

  // Handlers
  const handleObjectSelect = useCallback((objectId: string | null) => {
    setSelectedObjectId(objectId);
  }, []);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
  const handleZoomReset = () => setZoom(1);
  const handleFitView = () => setFitViewTrigger(t => t + 1);

  // Handle position change from 2D canvas
  const handlePositionChange = useCallback(async (id: string, position: { x: number; y: number }) => {
    // Find the object to determine its type
    const obj = objects?.find((o: any) => o.id === id);
    if (!obj) return;

    const table = obj.type === 'hallway' ? 'hallways' : obj.type === 'door' ? 'doors' : 'rooms';
    
    try {
      const { error } = await supabase
        .from(table)
        .update({ position })
        .eq('id', id);

      if (error) throw error;
      
      console.log(`[FloorPlan] Saved position for ${obj.type} ${id}:`, position);
    } catch (error) {
      console.error('Error saving position:', error);
      toast.error('Failed to save position');
    }
  }, [objects]);

  // Loading state
  if (isLoadingFloors) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading floor plans...</p>
        </div>
      </div>
    );
  }

  // No floors state
  if (floors.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4 max-w-md p-8">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">No Floors Available</h3>
          <p className="text-sm text-muted-foreground">
            Add floors to your building to start creating floor plans.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="flex-none border-b bg-card px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Floor Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {currentFloor?.buildings?.name || 'Building'}
              </span>
            </div>
            
            <Select value={selectedFloorId || ''} onValueChange={setSelectedFloorId}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent>
                {floors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    <span className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5" />
                      {floor.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Center: View Toggle & Zoom */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === '2d' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setViewMode('2d')}
              >
                <Square className="h-3.5 w-3.5 mr-1.5" />
                2D
              </Button>
              <Button
                variant={viewMode === '3d' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setViewMode('3d')}
              >
                <Box className="h-3.5 w-3.5 mr-1.5" />
                3D
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Zoom Controls */}
            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>
                
                <span className="text-xs font-medium w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFitView}>
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Center View</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomReset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset Zoom</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Right: Display Options */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showLabels ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowLabels(!showLabels)}
                  >
                    {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Labels</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showGrid ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Grid</TooltipContent>
              </Tooltip>

              {viewMode === '3d' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showConnections ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowConnections(!showConnections)}
                    >
                      <Move className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Connections</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas Area */}
        <div className="flex-1 relative bg-muted/30">
          {isLoadingData ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : viewMode === '2d' ? (
            <FloorPlan2DCanvas
              objects={filteredObjects}
              edges={edges}
              selectedObjectId={selectedObjectId}
              onObjectSelect={handleObjectSelect}
              onPositionChange={handlePositionChange}
              showLabels={showLabels}
              showGrid={showGrid}
              zoom={zoom}
            />
          ) : (
            <FloorPlan3DCanvas
              objects={filteredObjects}
              edges={edges}
              selectedObjectId={selectedObjectId}
              onObjectSelect={handleObjectSelect}
              onPositionChange={handlePositionChange}
              showLabels={showLabels}
              showConnections={showConnections}
              showGrid={showGrid}
              fitViewTrigger={fitViewTrigger}
            />
          )}

          {/* Stats Overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              {stats.total} Objects
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">
              {stats.rooms} Rooms
            </Badge>
            <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-600 border-slate-200">
              {stats.hallways} Hallways
            </Badge>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-200">
              {stats.doors} Doors
            </Badge>
          </div>

          {/* Help Tip */}
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur border rounded-lg px-3 py-2 shadow-sm">
            <p className="text-[10px] text-muted-foreground">
              {viewMode === '2d' ? (
                <>
                  <span className="font-medium">Drag</span> to select multiple • <span className="font-medium">Shift+Click</span> to add to selection • <span className="font-medium">Drag objects</span> to move
                </>
              ) : (
                <>
                  <span className="font-medium">Click+Drag</span> on object to move • <span className="font-medium">Right-click+Drag</span> to orbit • <span className="font-medium">Scroll</span> to zoom
                </>
              )}
            </p>
          </div>

          {/* Room Type Legend */}
          {viewMode === '3d' && (
            <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur border rounded-lg p-3 shadow-lg">
              <p className="text-[10px] font-medium text-muted-foreground mb-2">Room Types</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-amber-700" />
                  <span className="text-[10px]">Courtroom</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-[10px]">Office</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-indigo-500" />
                  <span className="text-[10px]">Conference</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-stone-500" />
                  <span className="text-[10px]">Storage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-cyan-500" />
                  <span className="text-[10px]">Restroom</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span className="text-[10px]">Lobby</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-zinc-500" />
                  <span className="text-[10px]">Utility</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-neutral-600" />
                  <span className="text-[10px]">Mechanical</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <FloorPlanSidebar
            objects={objects || []}
            filteredObjects={filteredObjects}
            selectedObject={selectedObject}
            selectedObjectId={selectedObjectId}
            onObjectSelect={handleObjectSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterType={filterType}
            onFilterChange={setFilterType}
            currentFloor={currentFloor}
          />
        )}
      </div>
    </div>
  );
}

export default FloorPlanViewer;
