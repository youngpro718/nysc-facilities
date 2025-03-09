
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Canvas } from '@react-three/fiber';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import { toast } from 'sonner';
import { InfoIcon, Maximize2Icon } from 'lucide-react';
import { ThreeDScene } from '../three-d/ThreeDScene';

interface ThreeDViewerProps {
  floorId: string | null;
  onObjectSelect?: (object: any) => void;
  selectedObjectId?: string | null;
  previewData?: any;
}

export function ThreeDViewer({ 
  floorId, 
  onObjectSelect, 
  selectedObjectId,
  previewData
}: ThreeDViewerProps) {
  const { objects, edges, isLoading } = useFloorPlanData(floorId);
  const [viewerError, setViewerError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [focusMode, setFocusMode] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleObjectSelect = (object: any) => {
    if (onObjectSelect) {
      const selectedObj = objects.find(obj => obj.id === object.id);
      if (selectedObj) {
        onObjectSelect({
          ...selectedObj,
          id: selectedObj.id,
          type: selectedObj.type,
          position: selectedObj.position,
          size: selectedObj.data.size,
          rotation: selectedObj.data.rotation || 0,
          properties: selectedObj.data.properties,
          label: selectedObj.data.label
        });
      }
    }
  };

  const handleCanvasError = (err: Error) => {
    console.error('ThreeDViewer error:', err);
    setViewerError(err);
    toast.error('Error rendering 3D view');
  };

  if (!floorId) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a floor to view the 3D model</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-gray-500">Loading 3D model...</p>
        </div>
      </Card>
    );
  }

  if (viewerError) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <p className="text-red-500 font-medium">Error rendering 3D view</p>
          <p className="text-gray-500 mt-2">Please try refreshing the page</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full overflow-hidden relative">
      <ErrorBoundary>
        {isMounted && (
          <Canvas
            shadows
            onError={handleCanvasError as any}
            gl={{ 
              antialias: true,
              alpha: false,
              preserveDrawingBuffer: true
            }}
            camera={{ 
              position: [0, 500, 500], 
              fov: 50,
              near: 0.1,
              far: 10000
            }}
            style={{ background: 'linear-gradient(to bottom, #e0f2fe, #f8fafc)' }}
          >
            <ThreeDScene 
              objects={objects} 
              connections={edges}
              onObjectSelect={handleObjectSelect} 
              selectedObjectId={selectedObjectId} 
              previewData={previewData}
              showLabels={showLabels}
            />
          </Canvas>
        )}
        
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-md">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Floor Plan Viewer</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setShowLabels(!showLabels)} 
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title={showLabels ? "Hide labels" : "Show labels"}
              >
                <InfoIcon size={14} />
              </button>
              <button 
                onClick={() => setFocusMode(!focusMode)} 
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title={focusMode ? "Exit focus mode" : "Enter focus mode"}
              >
                <Maximize2Icon size={14} />
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>Rooms</span>
              <span className="w-3 h-3 rounded-full bg-green-500 ml-2"></span>
              <span>Hallways</span>
              <span className="w-3 h-3 rounded-full bg-amber-500 ml-2"></span>
              <span>Doors</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
              <span>Direct connections</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
              <span>Door connections</span>
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span>Left-click + drag: Rotate</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span>Right-click + drag: Pan</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Scroll: Zoom</span>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </Card>
  );
}
