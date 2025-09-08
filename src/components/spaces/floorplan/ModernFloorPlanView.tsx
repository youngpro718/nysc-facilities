// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react';
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

interface Floor {
  id: string;
  floor_number: number;
  name: string;
  buildings: { name: string };
}

interface FloorPlanObject {
  id: string;
  type: 'room' | 'hallway' | 'door';
  position: { x: number; y: number };
  data: {
    size: { width: number; height: number };
    properties: FloorPlanObjectProperties;
  };
}

// Properties stored with each floor plan object. Add known keys as needed while
// keeping an index signature for extensibility coming from the editor.
interface FloorPlanObjectProperties {
  rotation?: number;
  label?: string;
  [key: string]: string | number | boolean | null | undefined;
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

  const { dialogState, openDialog, closeDialog } = useDialogManager();

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
        
        setFloors(data || []);
        if (data && data.length > 0 && !selectedFloor) {
          setSelectedFloor(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching floors:', error);
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

  // Handle property updates with real-time preview
  const handlePropertyUpdate = useCallback((updates: FloorPlanObjectProperties) => {
    if (!selectedObject) return;

    const posXParsed = parseFloat(String((updates as any).positionX ?? ''));
    const posYParsed = parseFloat(String((updates as any).positionY ?? ''));
    const position = {
      x: Number.isFinite(posXParsed) ? posXParsed : selectedObject.position.x,
      y: Number.isFinite(posYParsed) ? posYParsed : selectedObject.position.y,
    };

    const widthParsed = parseFloat(String((updates as any).width ?? ''));
    const heightParsed = parseFloat(String((updates as any).height ?? ''));
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
            
            <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
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
                  const match = (sceneObjects as any[]).find((o: any) => o.id === objectId);
                  if (match) handleObjectSelect(match as any);
                }}
                selectedObjectId={selectedObject?.id}
                previewData={previewData}
                showLabels={showLabels}
              />
            )}
          </div>

          {/* Floating Info Card */}
          {currentFloor && (
            <div className="absolute top-6 left-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20 dark:border-slate-700/50">
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

        {/* Enhanced Properties Panel */}
        <div 
          id="properties-panel"
          className="w-96"
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
      </div>

      {/* Search Panel */}
      <SearchPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        objects={filteredObjects}
        onObjectSelect={handleObjectSelect}
      />

      {/* Advanced Search Panel */}
      <AdvancedSearchPanel
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        objects={filteredObjects}
        onObjectSelect={handleObjectSelect}
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
