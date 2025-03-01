
import { useState, useEffect, useCallback } from 'react';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { VisualFloorSelector } from './components/VisualFloorSelector';
import { EditPropertiesPanel } from './components/EditPropertiesPanel';
import { ThreeDViewer } from './components/ThreeDViewer';
import { useDialogManager } from '@/hooks/useDialogManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, Minimize, RefreshCw } from 'lucide-react';

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

  // Fetch floors data
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
        // If we have floors and no selected floor, select the first one
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

  // Handle object selection
  const handleObjectSelect = useCallback((object: any) => {
    console.log('Selected object:', object);
    setSelectedObject(object);
    // Reset preview data when selecting a new object
    setPreviewData(null);
  }, []);

  // Reset selected object when floor changes
  useEffect(() => {
    setSelectedObject(null);
    setPreviewData(null);
  }, [selectedFloor]);

  // Handle property updates during edit
  const handlePropertyUpdate = useCallback((updates: any) => {
    console.log('Property updates:', updates);
    
    // Transform form values to proper object structure
    const position = {
      x: parseFloat(updates.positionX),
      y: parseFloat(updates.positionY)
    };
    
    const size = {
      width: parseFloat(updates.width),
      height: parseFloat(updates.height)
    };
    
    const rotation = parseFloat(updates.rotation);
    
    // Build properties object
    const properties = {
      room_number: updates.room_number,
      room_type: updates.room_type,
      status: updates.status
    };
    
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

  // When dialog closes, clear preview data
  useEffect(() => {
    if (!dialogState.isOpen) {
      setPreviewData(null);
    }
  }, [dialogState.isOpen]);

  // Handle zoom controls
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64">
          <VisualFloorSelector 
            floors={floors}
            selectedFloorId={selectedFloor} 
            onFloorSelect={setSelectedFloor} 
            isLoading={isLoading}
          />
        </div>
        
        <div className="flex-1 space-y-4">
          <Tabs defaultValue="2d" className="w-full" onValueChange={(value) => setViewMode(value as '2d' | '3d')}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="2d">2D View</TabsTrigger>
                <TabsTrigger value="3d">3D View</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomReset}>
                  <Maximize className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 2}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh floor plan">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <TabsContent value="2d">
              <FloorPlanCanvas 
                key={`2d-${refreshKey}`}
                floorId={selectedFloor} 
                onObjectSelect={handleObjectSelect}
                previewData={previewData}
                zoom={zoom}
              />
            </TabsContent>
            
            <TabsContent value="3d">
              <ThreeDViewer 
                key={`3d-${refreshKey}`}
                floorId={selectedFloor}
                onObjectSelect={handleObjectSelect}
                selectedObjectId={selectedObject?.id}
                previewData={previewData}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="w-full md:w-80">
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
