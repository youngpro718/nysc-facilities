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
              showLabels={showLabels}
              showConnections={showConnections}
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
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
              {stats.hallways} Hallways
            </Badge>
          </div>
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
