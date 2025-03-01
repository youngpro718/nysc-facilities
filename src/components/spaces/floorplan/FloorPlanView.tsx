
import { useState, useEffect } from 'react';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { VisualFloorSelector } from './components/VisualFloorSelector';
import { EditPropertiesPanel } from './components/EditPropertiesPanel';
import { ThreeDViewer } from './components/ThreeDViewer';
import { useDialogManager } from '@/hooks/useDialogManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function FloorPlanView() {
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const { dialogState, openDialog, closeDialog } = useDialogManager();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Handle object selection
  const handleObjectSelect = (object: any) => {
    setSelectedObject(object);
  };

  // Reset selected object when floor changes
  useEffect(() => {
    setSelectedObject(null);
  }, [selectedFloor]);

  // Handle property updates during edit
  const handlePropertyUpdate = (updates: any) => {
    setPreviewData({
      id: selectedObject?.id,
      data: updates,
      rotation: updates.rotation,
      position: updates.position
    });
  };

  // When dialog closes, clear preview data
  useEffect(() => {
    if (!dialogState.isOpen) {
      setPreviewData(null);
    }
  }, [dialogState.isOpen]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64">
          <VisualFloorSelector 
            selectedFloorId={selectedFloor} 
            onFloorSelect={setSelectedFloor} 
          />
        </div>
        
        <div className="flex-1 space-y-4">
          <Tabs defaultValue="2d" className="w-full" onValueChange={(value) => setViewMode(value as '2d' | '3d')}>
            <TabsList className="mb-4">
              <TabsTrigger value="2d">2D View</TabsTrigger>
              <TabsTrigger value="3d">3D View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="2d">
              <FloorPlanCanvas 
                floorId={selectedFloor} 
                onObjectSelect={handleObjectSelect}
                previewData={previewData}
              />
            </TabsContent>
            
            <TabsContent value="3d">
              <ThreeDViewer 
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
            onEdit={() => {
              if (selectedObject) {
                openDialog('propertyEdit', selectedObject);
              }
            }}
          />
        </div>
      </div>

      {dialogState.isOpen && dialogState.type === 'propertyEdit' && (
        <EditPropertiesPanel
          object={dialogState.data}
          onClose={closeDialog}
          onUpdate={handlePropertyUpdate}
        />
      )}
    </div>
  );
}
