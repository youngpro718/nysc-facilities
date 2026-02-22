// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from "lucide-react";
import { logger } from '@/lib/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RefreshCw, 
  Map, 
  Layers, 
  Eye, 
  EyeOff,
  Settings,
  Filter,
  Search,
  Download,
  Share2
} from 'lucide-react';
import { useDialogManager } from '@/hooks/useDialogManager';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { EnhancedPropertiesPanel } from './components/EnhancedPropertiesPanel';
import { EditPropertiesPanel } from './components/EditPropertiesPanel';
import { ModernThreeDViewer } from './components/ModernThreeDViewer';
import { FloorSelector } from './components/FloorSelector';
import { useFloorPlanData } from './hooks/useFloorPlanData';
import { SearchPanel } from './components/SearchPanel';
import { AdvancedSearchPanel } from './components/AdvancedSearchPanel';
import { ViewControls } from './components/ViewControls';
import { cn } from '@/lib/utils';
import { FloorPlanNode } from './types/floorPlanTypes';

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
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<FloorPlanObject | null>(null);
  const [previewData, setPreviewData] = useState<FloorPlanPreview | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState<number>(1);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
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
        viewMode: '2d' | '3d';
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
      if (typeof ((saved as Record<string, unknown>)).showConnectionsPref === 'boolean') setShowConnectionsPref(((saved as Record<string, unknown>)).showConnectionsPref);
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
          const status = (error as Record<string, unknown>)?.code || (error as Record<string, unknown>)?.status || (error as Record<string, unknown>)?.message;
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
          (data || []).map((f: Record<string, unknown>) => ({
            ...f,
            buildings: Array.isArray(f.buildings) ? f.buildings[0] : f.buildings
          }))
        );
        if (data && data.length > 0) {
          // If a saved floor exists and is still valid, keep it; otherwise default to Floor 1 (lowest floor_number)
          const exists = selectedFloor && data.some((f: Record<string, unknown>) => f.id === selectedFloor);
          if (!exists) {
            // Find the floor with the lowest floor_number (Floor 1)
            const lowestFloor = [...data].sort((a: Record<string, unknown>, b: Record<string, unknown>) => 
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

  // Handle object selection with improved UX
  const handleObjectSelect = useCallback((object: FloorPlanObject) => {
    setSelectedObject(object);
    setPreviewData(null);
    
    // Smooth scroll to properties panel
    const panel = document.getElementById('properties-panel');
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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

  // Load objects/edges for the selected floor (drives 3D and panels)
  const { objects: sceneObjects = [], edges: sceneEdges = [], isLoading: isObjectsLoading } = useFloorPlanData(selectedFloor);

  // Filter objects based on search and type
  const filteredObjects = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return (sceneObjects as unknown[]).filter((obj: Record<string, unknown>) => {
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
      {/* Modern Header with Floating Controls */}
      <div className="relative z-20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FloorSelector
              floors={floors}
              selectedFloorId={selectedFloor}
              onFloorSelect={setSelectedFloor}
              currentFloor={currentFloor}
            />
            
            <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-900/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as '2d' | '3d')}>
                <TabsList className="h-8 bg-transparent">
                  <TabsTrigger value="2d" className="text-xs px-3 py-1">2D</TabsTrigger>
                  <TabsTrigger value="3d" className="text-xs px-3 py-1">3D</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

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
          {/* Camera Actions */}
          {viewMode === '3d' && (
            <div className="ml-2 flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setCameraCommand({ type: 'fit' })}>
                Fit
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!selectedObject}
                onClick={() => selectedObject && setCameraCommand({ type: 'focus', id: selectedObject.id })}
              >
                Focus
              </Button>
            </div>
          )}
          {/* Properties Panel Toggle (visible on small screens) */}
          <div className="ml-3 sm:hidden">
            <Button size="sm" variant="outline" onClick={() => setShowProperties((v) => !v)}>
              {showProperties ? 'Hide' : 'Properties'}
            </Button>
          </div>
        </div>

        {/* Quick Filters for Floorplan */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="text-xs text-muted-foreground mr-2">Filter:</div>
          <Button size="sm" variant={filterType === 'all' ? 'default' : 'outline'} onClick={() => setFilterType('all')}>
            All
          </Button>
          <Button size="sm" variant={filterType === 'room' ? 'default' : 'outline'} onClick={() => setFilterType('room')}>
            Rooms
          </Button>
          <Button size="sm" variant={filterType === 'hallway' ? 'default' : 'outline'} onClick={() => setFilterType('hallway')}>
            Hallways
          </Button>
          <Button size="sm" variant={filterType === 'door' ? 'default' : 'outline'} onClick={() => setFilterType('door')}>
            Doors
          </Button>
          {viewMode === '3d' && (
            <>
              <div className="w-px h-6 bg-border mx-2" />
              <Button size="sm" variant={showConnectionsPref ? 'default' : 'outline'} onClick={() => setShowConnectionsPref((v) => !v)}>
                {showConnectionsPref ? 'Connections: On' : 'Connections: Off'}
              </Button>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-muted-foreground">Label Size</span>
                <input
                  type="range"
                  min={0.7}
                  max={2}
                  step={0.1}
                  value={labelScale}
                  onChange={(e) => setLabelScale(parseFloat(e.target.value))}
                />
                <Button size="sm" variant={moveEnabled ? 'default' : 'outline'} onClick={() => setMoveEnabled(v => !v)}>
                  {moveEnabled ? 'Move: On' : 'Move: Off'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 min-h-0 px-6 pb-6">
        {/* Floor Plan Canvas */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0">
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{
              backgroundImage: `
                linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}></div>
            {viewMode === '2d' ? (
              <FloorPlanCanvas
                key={`2d-${refreshKey}`}
                floorId={selectedFloor}
                onObjectSelect={handleObjectSelect}
                previewData={previewData}
                zoom={zoom}
              />
            ) : (
              <ModernThreeDViewer
                key={`3d-${refreshKey}`}
                floorId={selectedFloor}
                onObjectSelect={(objectId) => {
                  const match = (sceneObjects as unknown[]).find((o: Record<string, unknown>) => o.id === objectId);
                  if (match) handleObjectSelect(match as Record<string, unknown>);
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
            )}
          </div>

          {/* Floating Info Card */}
          {currentFloor && (
            <div className="absolute top-6 left-6 bg-white/95 dark:bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{currentFloor.buildings.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{currentFloor.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Properties Panel (hide on small screens unless toggled) */}
        {showProperties && (
          <div 
            id="properties-panel"
            className="w-96 hidden sm:block"
          >
            <EnhancedPropertiesPanel
              selectedObject={selectedObject}
              allObjects={filteredObjects}
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
        objects={filteredObjects}
        onObjectSelect={(obj: Record<string, unknown>) => handleObjectSelect(obj as FloorPlanObject)}
      />

      {/* Advanced Search Panel */}
      <AdvancedSearchPanel
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        objects={filteredObjects}
        onObjectSelect={(obj: Record<string, unknown>) => handleObjectSelect(obj as FloorPlanObject)}
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
