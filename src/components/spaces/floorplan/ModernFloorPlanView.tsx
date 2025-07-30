// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
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
import { EditPropertiesPanel } from './components/EditPropertiesPanel';
import { ModernThreeDViewer } from './components/ModernThreeDViewer';
import { FloorSelector } from './components/FloorSelector';
import { SearchPanel } from './components/SearchPanel';
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
    properties: any;
  };
  properties?: any;
}

export function ModernFloorPlanView() {
  const [selectedFloor, setSelectedFloor] = useState<string | null>(
    // Fallback to a known floor ID if available
    '2d2c3a20-4b7f-4583-8de1-543120a72b94'
  );
  const [selectedObject, setSelectedObject] = useState<FloorPlanObject | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { dialogState, openDialog, closeDialog } = useDialogManager();

  // Fetch floors with improved error handling
  useEffect(() => {
    const fetchFloors = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('floors')
          .select('*, buildings(name)')
          .order('floor_number', { ascending: false });

        if (error) throw error;
        
        setFloors(data || []);
        console.log('ModernFloorPlanView - Floors loaded:', data?.length || 0, 'floors');
        console.log('ModernFloorPlanView - Current selectedFloor:', selectedFloor);
        if (data && data.length > 0 && !selectedFloor) {
          console.log('ModernFloorPlanView - Setting selectedFloor to:', data[0].id);
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
  }, [selectedFloor]);

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
  const handlePropertyUpdate = useCallback((updates: any) => {
    if (!selectedObject) return;

    const position = {
      x: parseFloat(updates.positionX || selectedObject.position.x),
      y: parseFloat(updates.positionY || selectedObject.position.y)
    };

    const size = {
      width: parseFloat(updates.width || selectedObject.data.size.width),
      height: parseFloat(updates.height || selectedObject.data.size.height)
    };

    const rotation = parseFloat(updates.rotation || 0);

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

  // Filter objects based on search and type
  const filteredObjects = useMemo(() => {
    // This would be implemented based on actual data
    return [];
  }, [searchQuery, filterType]);

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
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 px-4 pb-4">
        {/* Floor Plan Canvas */}
        <div className="flex-1 relative bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="absolute inset-0">
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
                onObjectSelect={handleObjectSelect}
                selectedObjectId={selectedObject?.id}
                previewData={previewData}
                showLabels={showLabels}
              />
            )}
          </div>

          {/* Floating Info Card */}
          {currentFloor && (
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <h3 className="font-semibold text-sm">{currentFloor.buildings.name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">{currentFloor.name}</p>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        <div 
          id="properties-panel"
          className="w-80 ml-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="h-full overflow-auto">
            <PropertiesPanel
              selectedObject={selectedObject}
              onUpdate={() => {
                if (selectedObject) {
                  openDialog('propertyEdit', selectedObject);
                }
              }}
              onPreviewChange={handlePropertyUpdate}
            />
          </div>
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
