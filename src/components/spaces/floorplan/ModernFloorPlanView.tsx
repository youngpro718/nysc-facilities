import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Settings, Link2 } from "lucide-react";
import { logger } from '@/lib/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDialogManager } from '@/hooks/useDialogManager';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { EnhancedPropertiesPanel } from './components/EnhancedPropertiesPanel';
import { EditPropertiesPanel } from './components/EditPropertiesPanel';
import { ModernThreeDViewer } from './components/ModernThreeDViewer';
import { HallwayAttachOverlay } from './components/HallwayAttachOverlay';
import { FloorSelector } from './components/FloorSelector';
import { useFloorPlanData } from './hooks/useFloorPlanData';
import { SearchPanel } from './components/SearchPanel';
import { AdvancedSearchPanel } from './components/AdvancedSearchPanel';
import { ViewControls } from './components/ViewControls';
import { BulkPositionTool } from './components/BulkPositionTool';
import { cn } from '@/lib/utils';
import { FloorPlanNode } from './types/floorPlanTypes';
import { LayoutEditorCanvas } from './components/LayoutEditorCanvas';

interface Floor {
  id: string;
  floor_number: number;
  name: string;
  buildings: { name: string };
}

// Use the shared type or extends it if UI needs more specific fields
type FloorPlanObject = FloorPlanNode;

// Properties stored with each floor plan object. Add known keys as needed while
// keeping an index signature for extensibility coming from the editor.
interface FloorPlanObjectProperties {
  rotation?: number;
  label?: string;
  [key: string]: string | number | boolean | null | undefined | object;
}

interface FloorPlanPreview {
  id: string;
  position: { x: number; y: number };
  rotation: number;
  data: { size: { width: number; height: number }; properties: FloorPlanObjectProperties };
}

export function ModernFloorPlanView() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<FloorPlanObject | null>(null);
  const [previewData, setPreviewData] = useState<FloorPlanPreview | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState<number>(1);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'edit'>('2d');
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'room' | 'hallway' | 'door'>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [highlightedObjects, setHighlightedObjects] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const SETTINGS_KEY = 'modern_floorplan_settings_v1';
  const [showConnectionsPref, setShowConnectionsPref] = useState<boolean>(true);
  const [cameraCommand, setCameraCommand] = useState<null | { type: 'fit' } | { type: 'focus'; id: string }>(null);
  const [labelScale, setLabelScale] = useState<number>(1);
  const [moveEnabled, setMoveEnabled] = useState<boolean>(false);
  const isAdmin = true; // Temporary bypass or derive from user.role
  
  // Attach Mode State
  const [attachMode, setAttachMode] = useState<boolean>(false);
  const [selectedHallwayId, setSelectedHallwayId] = useState<string | null>(null);
  const [attachSide, setAttachSide] = useState<'north'|'south'|'east'|'west'>('north');
  const [offsetPercent, setOffsetPercent] = useState<number>(50);

  // Overlay-specific state: tracks the hallway being configured and the room to place
  const [overlayHallwayId, setOverlayHallwayId] = useState<string | null>(null);
  const [overlayHallwayName, setOverlayHallwayName] = useState<string>('');
  const [overlayRoomId, setOverlayRoomId] = useState<string | null>(null);
  const [overlayRoomName, setOverlayRoomName] = useState<string>('');
  const [overlayRoomType, setOverlayRoomType] = useState<string>('');

  const { dialogState, openDialog, closeDialog } = useDialogManager();

  // Set initial properties panel visibility based on screen size
  useEffect(() => {
    const updatePanel = () => {
      const isSmall = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
      setShowProperties(!isSmall);
      // Default to fewer visuals on small screens
      setShowConnectionsPref(!isSmall);
    };
    updatePanel();
    window.addEventListener('resize', updatePanel);
    return () => window.removeEventListener('resize', updatePanel);
  }, []);

  // Load persisted preferences on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        viewMode: '2d' | '3d' | 'edit';
        showLabels: boolean;
        showGrid: boolean;
        filterType: 'all' | 'room' | 'hallway' | 'door';
        showProperties: boolean;
        selectedFloor: string | null;
        labelScale: number;
        moveEnabled: boolean;
      }>;
      if (saved.viewMode) setViewMode(saved.viewMode);
      if (typeof saved.showLabels === 'boolean') setShowLabels(saved.showLabels);
      if (typeof saved.showGrid === 'boolean') setShowGrid(saved.showGrid);
      if (saved.filterType) setFilterType(saved.filterType);
      if (typeof saved.showProperties === 'boolean') setShowProperties(saved.showProperties);
      if (saved.selectedFloor) setSelectedFloor(saved.selectedFloor);
      if (typeof (saved as any).showConnectionsPref === 'boolean') setShowConnectionsPref((saved as any).showConnectionsPref as boolean);
      if (typeof saved.labelScale === 'number') setLabelScale(saved.labelScale);
      if (typeof saved.moveEnabled === 'boolean') setMoveEnabled(saved.moveEnabled);
    } catch {}
  }, []);

  // Persist preferences when they change
  useEffect(() => {
    try {
      const toSave = {
        viewMode,
        showLabels,
        showGrid,
        filterType,
        showProperties,
        selectedFloor,
        showConnectionsPref,
        labelScale,
        moveEnabled,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
    } catch {}
  }, [viewMode, showLabels, showGrid, filterType, showProperties, selectedFloor, showConnectionsPref, labelScale, moveEnabled]);

  // Fetch floors with improved error handling
  useEffect(() => {
    const fetchFloors = async () => {
      setIsLoading(true);
      try {
        // If auth state is still resolving, wait to avoid false negatives
        if (authLoading) return;

        const { data, error } = await supabase
          .from('floors')
          .select('*, buildings!floors_building_id_fkey(name)')
          .order('floor_number', { ascending: false });

        if (error) {
          // Only show sign-in message if RLS/auth blocks the request
          const status = (error as any)?.code || (error as any)?.status || (error as any)?.message;
          if (String(status).includes('401') || String(status).includes('403')) {
            toast.message('Sign in required', {
              description: 'Please sign in to load floors and floorplans.',
            });
          } else {
            throw error;
          }
          return;
        }
        
        setFloors(
          (data || []).map((f: any) => ({
            ...f,
            buildings: Array.isArray(f.buildings) ? f.buildings[0] : f.buildings
          })) as Floor[]
        );
        if (data && data.length > 0) {
          // If a saved floor exists and is still valid, keep it; otherwise default to Floor 1 (lowest floor_number)
          const exists = selectedFloor && data.some((f: any) => f.id === selectedFloor);
          if (!exists) {
            // Find the floor with the lowest floor_number (Floor 1)
            const lowestFloor = [...data].sort((a: any, b: any) => 
              (a.floor_number as number) - (b.floor_number as number)
            )[0];
            setSelectedFloor(lowestFloor.id);
          }
        }
      } catch (error) {
        logger.error('Error fetching floors:', error);
        toast.error('Failed to load floors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFloors();
  }, [user, authLoading]);

  // Load objects/edges for the selected floor (drives 3D and panels)
  const { objects: sceneObjects = [], edges: sceneEdges = [], isLoading: isObjectsLoading } = useFloorPlanData(selectedFloor);

  // Handle object selection with improved UX and Attach Mode logic
  const handleObjectSelect = useCallback((object: Record<string, any>) => {
    if (attachMode) {
      if (object.type === 'hallway') {
        setSelectedHallwayId(object.id as string);
        toast.success('Hallway selected. Now click a room to attach.');
        return;
      }
      
      if (object.type === 'room' && selectedHallwayId) {
        const hallway = (sceneObjects as any[]).find(n => n.id === selectedHallwayId);
        if (!hallway) {
          toast.error('Selected hallway not found');
          return;
        }

        const hallSize = hallway.size || hallway.data?.size || { width: 300, height: 50 };
        const hallPos = hallway.position || { x: 0, y: 0 };
        const hallCenter = { x: hallPos.x + hallSize.width/2, y: hallPos.y + hallSize.height/2 };
        
        const roomSize = object.size || object.data?.size || { width: 150, height: 100 };
        const roomPos = object.position || { x: 0, y: 0 };
        const roomCenterInitial = { x: roomPos.x + roomSize.width/2, y: roomPos.y + roomSize.height/2 };
        
        const gap = 20;
        const isHorizontal = hallSize.width >= hallSize.height;
        let newCenter = { x: roomCenterInitial.x, y: roomCenterInitial.y };
        let newRotation = 0;
        
        if (isHorizontal) {
          // Place along X using offset percent
          const minX = hallPos.x + roomSize.width/2;
          const maxX = hallPos.x + hallSize.width - roomSize.width/2;
          const targetX = hallPos.x + (offsetPercent / 100) * hallSize.width;
          newCenter.x = Math.max(minX, Math.min(maxX, targetX));
          
          // Perpendicular placement on Y
          const offsetY = hallSize.height/2 + roomSize.height/2 + gap;
          if (attachSide === 'north') newCenter.y = hallCenter.y - offsetY; 
          else if (attachSide === 'south') newCenter.y = hallCenter.y + offsetY; 
          else newCenter.y = hallCenter.y - offsetY;
          newRotation = 0; // face hallway
        } else {
          // Place along Y using offset percent
          const minY = hallPos.y + roomSize.height/2;
          const maxY = hallPos.y + hallSize.height - roomSize.height/2;
          const targetY = hallPos.y + (offsetPercent / 100) * hallSize.height;
          newCenter.y = Math.max(minY, Math.min(maxY, targetY));
          
          // Perpendicular placement on X
          const offsetX = hallSize.width/2 + roomSize.width/2 + gap;
          if (attachSide === 'west') newCenter.x = hallCenter.x - offsetX; 
          else if (attachSide === 'east') newCenter.x = hallCenter.x + offsetX; 
          else newCenter.x = hallCenter.x + offsetX;
          newRotation = 90;
        }
        
        const newTopLeft = { 
          x: Math.round(newCenter.x - roomSize.width/2), 
          y: Math.round(newCenter.y - roomSize.height/2) 
        };
        
        // Optimistic local preview update
        setPreviewData({
          id: object.id as string,
          position: newTopLeft,
          rotation: newRotation,
          data: { size: roomSize, properties: object.data?.properties || {} }
        });

        // Persist to DB
        (async () => {
          const { error } = await supabase
            .from('rooms')
            .update({ position: newTopLeft, rotation: newRotation })
            .eq('id', object.id);
            
          if (error) {
            logger.error('Failed to update room position', error);
            toast.error('Failed to attach room');
            setPreviewData(null); // revert
          } else {
            toast.success('Room attached to hallway');
            queryClient.invalidateQueries({ queryKey: ['floorplan-objects', selectedFloor] });
          }
        })();
        return;
      }
    }

    // If overlay is open and user clicks a room, set it as the overlay's selected room
    if (overlayHallwayId && object.type === 'room') {
      setOverlayRoomId(object.id as string);
      setOverlayRoomName((object as any).name || (object as any).data?.label || '');
      setOverlayRoomType((object as any).room_type || (object as any).data?.type || 'room');
      // Also update the main selection for the properties panel
      setSelectedObject(object as FloorPlanObject);
      setPreviewData(null);
      return;
    }

    // If user clicks a hallway, open the overlay
    if (viewMode === '3d' && object.type === 'hallway') {
      setOverlayHallwayId(object.id as string);
      setOverlayHallwayName((object as any).name || (object as any).data?.label || 'Hallway');
      setOverlayRoomId(null);
      setOverlayRoomName('');
      setOverlayRoomType('');
    }

    // Normal selection behavior
    setSelectedObject(object as FloorPlanObject);
    setPreviewData(null);
    
    // Smooth scroll to properties panel
    const panel = document.getElementById('properties-panel');
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [attachMode, selectedHallwayId, attachSide, offsetPercent, sceneObjects, selectedFloor, queryClient, overlayHallwayId, viewMode]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle property updates with real-time preview
  const handlePropertyUpdate = useCallback((updates: FloorPlanObjectProperties) => {
    if (!selectedObject) return;

    const posXParsed = parseFloat(String(((updates as Record<string, unknown>)).positionX ?? ''));
    const posYParsed = parseFloat(String(((updates as Record<string, unknown>)).positionY ?? ''));
    const position = {
      x: Number.isFinite(posXParsed) ? posXParsed : selectedObject.position.x,
      y: Number.isFinite(posYParsed) ? posYParsed : selectedObject.position.y,
    };

    const widthParsed = parseFloat(String(((updates as Record<string, unknown>)).width ?? ''));
    const heightParsed = parseFloat(String(((updates as Record<string, unknown>)).height ?? ''));
    const size = {
      width: Number.isFinite(widthParsed) ? widthParsed : selectedObject.data.size.width,
      height: Number.isFinite(heightParsed) ? heightParsed : selectedObject.data.size.height,
    };

    const rotParsed = parseFloat(String((updates.rotation as number | string | undefined) ?? ''));
    const rotation = Number.isFinite(rotParsed) ? rotParsed : 0;

    setPreviewData({
      id: selectedObject.id,
      position,
      rotation,
      data: { size, properties: updates }
    });
  }, [selectedObject]);

  // Reset selection on floor change
  useEffect(() => {
    setSelectedObject(null);
    setPreviewData(null);
    setSelectedHallwayId(null);
  }, [selectedFloor]);

  // Auto-fit when switching to 3D or changing floors
  useEffect(() => {
    if (viewMode === '3d') {
      setCameraCommand({ type: 'fit' });
    }
  }, [viewMode, selectedFloor]);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleZoomReset = () => setZoom(1);
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Floor plan refreshed');
  };

  // Filter objects based on search and type
  const filteredObjects = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return (sceneObjects as any[]).filter((obj: any) => {
      if (!obj) return false;
      if (filterType !== 'all' && obj.type !== filterType) return false;
      if (!q) return true;
      const name = String(obj?.data?.properties?.label || obj?.data?.name || obj?.name || '').toLowerCase();
      const desc = String(obj?.data?.properties?.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [sceneObjects, searchQuery, filterType]);

  const currentFloor = useMemo(() => 
    floors.find(f => f.id === selectedFloor), 
    [floors, selectedFloor]
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Loading floor plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800", isFullscreen && "fixed inset-0 z-50")}>
      {/* Compact Single-Row Header */}
      <div className="relative z-20 px-2 py-1.5 flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Floor selector + View mode + Filters */}
        <div className="flex items-center gap-2">
          <FloorSelector
            floors={floors}
            selectedFloorId={selectedFloor}
            onFloorSelect={setSelectedFloor}
            currentFloor={currentFloor}
          />

          <div className="h-5 w-px bg-border" />

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as '2d' | '3d' | 'edit')}>
            <TabsList className="h-7 bg-muted/50 p-0.5">
              <TabsTrigger value="2d" className="text-[11px] px-2 py-0.5 h-6">2D</TabsTrigger>
              <TabsTrigger value="3d" className="text-[11px] px-2 py-0.5 h-6">3D</TabsTrigger>
              <TabsTrigger value="edit" className="text-[11px] px-2 py-0.5 h-6">✏️ Edit</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="h-5 w-px bg-border hidden sm:block" />

          {/* Compact Filter Chips */}
          <div className="hidden sm:flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
            {(['all', 'room', 'hallway', 'door'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-medium transition-colors capitalize",
                  filterType === type 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type === 'all' ? 'All' : type + 's'}
              </button>
            ))}
          </div>

          {/* 3D-specific controls */}
          {viewMode === '3d' && (
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => setShowConnectionsPref((v) => !v)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                  showConnectionsPref 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Connections
              </button>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Labels</span>
                <input
                  type="range"
                  min={0.7}
                  max={2}
                  step={0.1}
                  value={labelScale}
                  onChange={(e) => setLabelScale(parseFloat(e.target.value))}
                  className="w-14 h-1 accent-primary"
                />
              </div>
              <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[11px]" onClick={() => setCameraCommand({ type: 'fit' })}>
                Fit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-[11px]"
                disabled={!selectedObject}
                onClick={() => selectedObject && setCameraCommand({ type: 'focus', id: selectedObject.id })}
              >
                Focus
              </Button>
            </div>
          )}
        </div>

        {/* Right: Search/Refresh + Attach + Properties toggle */}
        <div className="flex items-center gap-1.5">
          <ViewControls
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onRefresh={handleRefresh}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels(!showLabels)}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            onSearch={() => setIsSearchOpen(true)}
            onAdvancedSearch={() => setIsAdvancedSearchOpen(true)}
          />

          {/* Bulk Position Tool */}
          {viewMode === '2d' && (
            <BulkPositionTool
              objects={filteredObjects as any}
              floorId={selectedFloor}
              onApply={(updates) => {
                // Apply preview positions to the canvas via previewData
                // Each update triggers a preview; for bulk we just refresh
                updates.forEach(u => {
                  setPreviewData({
                    id: u.id,
                    position: u.position,
                    rotation: 0,
                    data: { size: { width: 150, height: 100 }, properties: {} }
                  });
                });
              }}
              onRefresh={handleRefresh}
            />
          )}

          {/* Attach Mode Toggle */}
          {isAdmin && (
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  size="sm" 
                  variant={attachMode ? 'default' : 'ghost'}
                  className={cn("h-7 px-2 text-[11px] gap-1", attachMode && "bg-primary text-primary-foreground")}
                >
                  <Link2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Attach</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Attach Mode</span>
                    <Button
                      size="sm"
                      variant={attachMode ? 'default' : 'outline'}
                      className="h-6 px-2 text-[11px]"
                      onClick={() => setAttachMode(v => !v)}
                    >
                      {attachMode ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                  {attachMode && (
                    <>
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-muted-foreground">Side</span>
                        <div className="flex gap-1">
                          {(['north', 'south', 'east', 'west'] as const).map((side) => (
                            <Button
                              key={side}
                              size="sm"
                              variant={attachSide === side ? 'default' : 'outline'}
                              onClick={() => setAttachSide(side)}
                              className="h-6 w-6 p-0 text-[10px] uppercase"
                            >
                              {side.charAt(0)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {selectedHallwayId && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Offset</span>
                            <span className="text-[10px] text-muted-foreground">{offsetPercent}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={offsetPercent}
                            onChange={(e) => setOffsetPercent(parseInt(e.target.value))}
                            className="w-full h-1 accent-primary"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Properties toggle for mobile */}
          <Button size="sm" variant="ghost" className="h-7 px-1.5 sm:hidden" onClick={() => setShowProperties((v) => !v)}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-1.5 min-h-0 px-2 pb-2">
        {/* Floor Plan Canvas */}
        <div className="flex-1 relative bg-muted/30 rounded-lg overflow-hidden border border-border">
          <div className="absolute inset-0">
            {viewMode === '2d' ? (
              <FloorPlanCanvas
                key={`2d-${refreshKey}`}
                floorId={selectedFloor}
                onObjectSelect={handleObjectSelect}
                previewData={previewData as any}
                zoom={zoom}
              />
            ) : (
              <>
                <ModernThreeDViewer
                  key={`3d-${refreshKey}`}
                  floorId={selectedFloor}
                  onObjectSelect={(objectId) => {
                    const match = (sceneObjects as any[]).find((o: any) => o.id === objectId);
                    if (match) handleObjectSelect(match as any);
                  }}
                  selectedObjectId={selectedObject?.id}
                  previewData={previewData}
                  showLabels={showLabels}
                  filterType={filterType}
                  showConnectionsExternal={showConnectionsPref}
                  commandToken={cameraCommand}
                  labelScale={labelScale}
                  moveEnabled={moveEnabled}
                />
                {overlayHallwayId && (
                  <HallwayAttachOverlay
                    hallwayId={overlayHallwayId}
                    hallwayName={overlayHallwayName}
                    selectedRoomId={overlayRoomId}
                    selectedRoomName={overlayRoomName}
                    selectedRoomType={overlayRoomType}
                    onClose={() => {
                      setOverlayHallwayId(null);
                      setOverlayRoomId(null);
                    }}
                    onRefresh={handleRefresh}
                  />
                )}
              </>
            )}
          </div>

          {/* Floating Zoom Controls — bottom center */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <ViewControls
              floating
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onRefresh={handleRefresh}
              showLabels={showLabels}
              onToggleLabels={() => setShowLabels(!showLabels)}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid(!showGrid)}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              onSearch={() => setIsSearchOpen(true)}
            />
          </div>
        </div>

        {/* Properties Panel — narrower, collapsible */}
        {showProperties && (
          <div 
            id="properties-panel"
            className="w-72 hidden sm:block"
          >
            <EnhancedPropertiesPanel
              selectedObject={selectedObject}
              allObjects={filteredObjects as any}
              onUpdate={() => {
                if (selectedObject) {
                  openDialog('propertyEdit', selectedObject);
                }
              }}
              onPreviewChange={handlePropertyUpdate}
              selectedFloorName={currentFloor?.name}
            />
          </div>
        )}
      </div>

      {/* Search Panel */}
      <SearchPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
        onClear={handleClearSearch}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        objects={filteredObjects as any}
        onObjectSelect={(obj: any) => handleObjectSelect(obj)}
      />

      {/* Advanced Search Panel */}
      <AdvancedSearchPanel
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        objects={filteredObjects as any}
        onObjectSelect={(obj: any) => handleObjectSelect(obj)}
        onHighlightObjects={setHighlightedObjects}
      />

      {/* Edit Dialog */}
      {dialogState.isOpen && dialogState.type === 'propertyEdit' && (
        <EditPropertiesPanel
          object={dialogState.data}
          onClose={closeDialog}
          onUpdate={handlePropertyUpdate}
          onPreview={handlePropertyUpdate}
        />
      )}
    </div>
  );
}
