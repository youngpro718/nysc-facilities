
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Canvas } from '@react-three/fiber';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import { toast } from 'sonner';
import { Scene3D } from '../3d/Scene3D';
import { ObjectTooltip } from '../3d/ObjectTooltip';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Home, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

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
  const { objects, isLoading } = useFloorPlanData(floorId);
  const [viewerError, setViewerError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [hoverObject, setHoverObject] = useState<any | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{x: number, y: number} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
          properties: selectedObj.data.properties
        });
      }
    }
  };

  const handleCanvasError = (err: Error) => {
    console.error('ThreeDViewer error:', err);
    setViewerError(err);
    toast.error('Error rendering 3D view');
  };
  
  const handlePointerMove = (event: React.PointerEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCursorPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  };
  
  const handleResetView = () => {
    // Will trigger the camera reset in Scene3D
    setIsMounted(false);
    setTimeout(() => setIsMounted(true), 50);
    toast.success('View reset');
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
    <Card className="w-full h-full overflow-hidden relative" onPointerMove={handlePointerMove}>
      <ErrorBoundary>
        {isMounted && (
          <Canvas
            ref={canvasRef}
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
            onPointerMissed={() => setHoverObject(null)}
            onCreated={({ gl }) => {
              gl.setClearColor('#e0f2fe');
              gl.toneMapping = 3; // ACESFilmicToneMapping
              gl.toneMappingExposure = 1.1;
            }}
          >
            <Scene3D 
              objects={objects} 
              onObjectSelect={handleObjectSelect} 
              selectedObjectId={selectedObjectId} 
              previewData={previewData}
            />
          </Canvas>
        )}
        
        <ObjectTooltip 
          object={hoverObject} 
          position={cursorPosition} 
        />
        
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 backdrop-blur-sm rounded-full h-8 w-8"
            onClick={handleResetView}
            title="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 backdrop-blur-sm rounded-full h-8 w-8"
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? "Hide labels" : "Show labels"}
          >
            {showLabels ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 backdrop-blur-sm rounded-full h-8 w-8"
            onClick={() => toast.info("First person view coming soon!")}
            title="Toggle first person view"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-md shadow-md">
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-4 h-4 rounded-full bg-blue-500"></span>
              <span>Left-click + drag: Rotate</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-4 h-4 rounded-full bg-green-500"></span>
              <span>Right-click + drag: Pan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500"></span>
              <span>Scroll: Zoom</span>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </Card>
  );
}
