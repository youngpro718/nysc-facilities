import { useState, useEffect, useCallback } from 'react';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { EditPropertiesPanel } from './components/EditPropertiesPanel';
import { ThreeDViewer } from './components/ThreeDViewer';
import { useDialogManager } from '@/hooks/useDialogManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, RefreshCw } from 'lucide-react';
import { SimpleFloorSelector } from './components/SimpleFloorSelector';

export function FloorPlanView() {
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const { dialogState, openDialog, closeDialog } = useDialogManager();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [floors, setFloors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState<number>(1);
  const [refreshKey, setRefreshKey] = useState<number>(0);

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
  }, [selectedFloor]);

  const handleObjectSelect = useCallback((object: any) => {
    console.log('Selected object:', object);
    setSelectedObject(object);
    setPreviewData(null);
  }, []);

  useEffect(() => {
    setSelectedObject(null);
    setPreviewData(null);
  }, [selectedFloor]);

  const handlePropertyUpdate = useCallback((updates: any) => {
    console.log('Property updates:', updates);
    
    const position = {
      x: parseFloat(updates.positionX),
      y: parseFloat(updates.positionY)
    };
    
    const size = {
      width: parseFloat(updates.width),
      height: parseFloat(updates.height)
    };
    
    const rotation = parseFloat(updates.rotation);
    
    let properties: Record<string, any> = {};
    
    if (selectedObject?.type === 'room') {
      properties = {
        room_number: updates.room_number,
        room_type: updates.room_type,
        status: updates.status
      };
    } else if (selectedObject?.type === 'hallway') {
      properties = {
        section: updates.section,
        hallwayType: updates.hallwayType,
        traffic_flow: updates.traffic_flow,
        accessibility: updates.accessibility,
        emergency_route: updates.emergency_route
      };
    } else if (selectedObject?.type === 'door') {
      properties = {
        security_level: updates.security_level,
        status: updates.status
      };
    }
    
    if (selectedObject?.properties?.lighting_fixtures) {
      properties.lighting_fixtures = selectedObject.properties.lighting_fixtures;
      properties.functional_lights = selectedObject.properties.functional_lights;
      properties.total_lights = selectedObject.properties.total_lights;
      properties.lighting_status = selectedObject.properties.lighting_status;
    }
    
    setPreviewData({
      id: selectedObject?.id,
      position,
      rotation,
      data: {
        size,
        properties
      }
    });
  }, [selectedObject]);

  useEffect(() => {
    if (!dialogState.isOpen) {
      setPreviewData(null);
    }
  }, [dialogState.isOpen]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Floor plan refreshed');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center space-x-4">
            <SimpleFloorSelector
              selectedFloorId={selectedFloor}
              onFloorSelect={setSelectedFloor}
            />
            <div className="h-6 w-px bg-border" />
            <Tabs 
              value={viewMode} 
              onValueChange={(value) => setViewMode(value as '2d' | '3d')}
              className="w-full"
            >
              <TabsList className="h-9 bg-muted/50">
                <TabsTrigger value="2d">2D View</TabsTrigger>
                <TabsTrigger value="3d">3D View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-muted/50 rounded-md p-1 flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5} className="h-7 px-2">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2 min-w-[3rem] text-center">{(zoom * 100).toFixed(0)}%</span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 2} className="h-7 px-2">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleZoomReset} className="h-7 px-2">
              <Maximize className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border" />
            <Button variant="ghost" size="sm" onClick={handleRefresh} title="Refresh floor plan" className="h-7 px-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative">
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
              <ThreeDViewer 
                key={`3d-${refreshKey}`}
                floorId={selectedFloor}
                selectedObjectId={selectedObject?.id}
                previewData={previewData}
                onObjectSelect={handleObjectSelect}
              />
            )}
          </div>
        </div>

        <div className="w-80 border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
