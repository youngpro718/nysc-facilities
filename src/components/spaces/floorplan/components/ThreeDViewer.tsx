import { useEffect, useState, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { Card } from '@/components/ui/card';
import { Canvas } from '@react-three/fiber';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import { toast } from 'sonner';
import { 
  InfoIcon, 
  Maximize2Icon, 
  Building2Icon,
  HomeIcon,
  DoorOpenIcon,
  EyeIcon,
  EyeOffIcon,
  SunIcon,
  CameraIcon,
  MousePointerClickIcon,
  LayersIcon,
  ZapIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from 'lucide-react';
import { ThreeDScene } from '../three-d/ThreeDScene';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ThreeDViewerProps {
  floorId: string | null;
  onObjectSelect?: (object: Record<string, unknown>) => void;
  selectedObjectId?: string | null;
  previewData?: Record<string, unknown>;
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
  const [showConnections, setShowConnections] = useState<boolean>(true);
  const [lightIntensity, setLightIntensity] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'default' | 'rooms' | 'hallways' | 'doors'>('default');
  const [cameraMode, setCameraMode] = useState<'orbit' | 'top' | 'perspective'>('perspective');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showStats, setShowStats] = useState<boolean>(true);
  const canvasRef = useRef<unknown>(null);
  const sceneRef = useRef<unknown>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleObjectSelect = useCallback((object: Record<string, unknown>) => {
    if (onObjectSelect) {
      const selectedObj = objects.find(obj => obj.id === object.id || obj.id === object);
      if (selectedObj) {
        const formattedObj = {
          ...selectedObj,
          id: selectedObj.id,
          type: selectedObj.type,
          position: selectedObj.position,
          size: selectedObj.data?.size || selectedObj.size,
          rotation: selectedObj.data?.rotation || selectedObj.rotation || 0,
          properties: selectedObj.data?.properties || selectedObj.properties,
          label: selectedObj.data?.label || selectedObj.label || selectedObj.data?.room_number || 'Unnamed'
        };
        
        onObjectSelect(formattedObj);
        
        // More informative toast with object details
        const label = formattedObj.label || formattedObj.properties?.room_number || 'Unnamed';
        const type = formattedObj.type.charAt(0).toUpperCase() + formattedObj.type.slice(1);
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            <span>Selected {type}: <strong>{label}</strong></span>
          </div>
        );
      }
    }
  }, [objects, onObjectSelect]);

  const handleCanvasError = (error: unknown) => {
    logger.error('Canvas error:', error);
    setViewerError(error);
    toast.error('Error loading 3D view. Please try refreshing the page.');
  };

  const handleTakeScreenshot = () => {
    try {
      if (canvasRef.current) {
        const link = document.createElement('a');
        link.setAttribute('download', `floorplan-${floorId}.png`);
        link.setAttribute('href', canvasRef.current.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
        link.click();
        toast.success('Screenshot downloaded!');
      }
    } catch (err) {
      logger.error('Screenshot error:', err);
      toast.error('Failed to take screenshot');
    }
  };

  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => !prev);
    toast.info(focusMode ? 'Focus mode disabled' : 'Focus mode enabled');
  }, [focusMode]);

  const handleCameraReset = useCallback(() => {
    if (sceneRef.current?.resetCamera) {
      sceneRef.current.resetCamera();
      toast.success('Camera reset to default view');
    }
  }, []);

  const handleFitToView = useCallback(() => {
    if (sceneRef.current?.fitToFloor) {
      sceneRef.current.fitToFloor();
      toast.success('View fitted to floor plan');
    }
  }, []);

  const getCameraConfig = useCallback(() => {
    switch (cameraMode) {
      case 'top':
        return {
          position: [0, 1200, 0] as [number, number, number],
          fov: 50,
          up: [0, 0, -1]
        };
      case 'perspective':
        return {
          position: [400, 800, 800] as [number, number, number],
          fov: 45
        };
      case 'orbit':
      default:
        return {
          position: [600, 600, 600] as [number, number, number],
          fov: 40
        };
    }
  }, [cameraMode]);

  const CanvasWrapper = () => {
    const cameraConfig = getCameraConfig();
    
    return (
      <ErrorBoundary>
        <Canvas
          ref={canvasRef}
          camera={cameraConfig}
          shadows
          gl={{ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
          }}
          style={{ 
            width: '100%', 
            height: '100%',
            background: focusMode ? '#0a0a0a' : '#f8f9fa'
          }}
        >
          <ThreeDScene 
            ref={sceneRef}
            objects={objects || []} 
            connections={edges || []} 
            onObjectSelect={handleObjectSelect}
            selectedObjectId={selectedObjectId}
            showLabels={showLabels}
            showConnections={showConnections}
            lightIntensity={lightIntensity}
            previewData={previewData}
            viewMode={viewMode}
            configuration={{
              gridSize: showGrid ? 50 : 0,
              enableDamping: true,
              dampingFactor: 0.05,
              rotateSpeed: 0.5,
              minDistance: 200,
              maxDistance: 2000
            }}
          />
        </Canvas>
      </ErrorBoundary>
    );
  };

  if (!floorId) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <div className="relative">
              <Building2Icon className="h-16 w-16 mx-auto text-gray-400" />
              <LayersIcon className="h-8 w-8 absolute bottom-0 right-1/3 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">No Floor Selected</h3>
              <p className="text-sm text-gray-500 mt-2">Please select a floor from the dropdown above to view its 3D model</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <LayersIcon className="h-4 w-4 mr-2" />
              Select Floor to Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto" />
              <Building2Icon className="h-8 w-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Loading 3D View</h3>
              <p className="text-sm text-gray-500 mt-1">Rendering floor plan in 3D...</p>
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (viewerError) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 max-w-md">
          <div className="rounded-full bg-red-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <InfoIcon className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-red-600 font-medium mb-2">Error rendering 3D view</p>
          <p className="text-gray-500 mb-4">Try refreshing the page or check your browser compatibility</p>
          <p className="text-xs text-gray-400 bg-gray-100 p-2 rounded overflow-x-auto">
            {viewerError.message}
          </p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </Card>
    );
  }

  // Count objects by type and calculate statistics
  const objectCounts = {
    rooms: objects.filter(obj => obj.type === 'room').length,
    hallways: objects.filter(obj => obj.type === 'hallway').length,
    doors: objects.filter(obj => obj.type === 'door').length,
    total: objects.length
  };

  // Use raw selected object data for the inline info panel to match 2D
  const selectedObjectData = selectedObjectId ? (() => {
    const o = objects.find(obj => obj.id === selectedObjectId);
    if (!o) return null;
    return {
      ...o,
      position: o.position,
      size: o.data?.size || o.size,
      rotation: o.data?.rotation || o.rotation || 0,
      properties: o.data?.properties || o.properties,
      label: o.data?.label || o.label || o.data?.room_number || 'Unnamed'
    };
  })() : null;

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Main 3D Canvas */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        {isMounted && <CanvasWrapper />}
      </div>

      {/* Enhanced Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-20">
        {/* Left Controls */}
        <div className="flex flex-col gap-2">
          <Card className="p-2 pointer-events-auto bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={showLabels ? "default" : "outline"} 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => setShowLabels(!showLabels)}
                    >
                      {showLabels ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showLabels ? 'Hide' : 'Show'} Labels</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={showGrid ? "default" : "outline"} 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => setShowGrid(!showGrid)}
                    >
                      <LayersIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showGrid ? 'Hide' : 'Show'} Grid</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={showConnections ? "default" : "outline"} 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => setShowConnections(!showConnections)}
                    >
                      <ZapIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showConnections ? 'Hide' : 'Show'} Connections</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="h-6 mx-1" />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={focusMode ? "default" : "outline"} 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={toggleFocusMode}
                    >
                      <Maximize2Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{focusMode ? 'Exit' : 'Enter'} Focus Mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </Card>

          {/* Camera Controls */}
          <Card className="p-2 pointer-events-auto bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={cameraMode === 'perspective' ? "default" : "outline"} 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => setCameraMode('perspective')}
                    >
                      <CameraIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Perspective View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={cameraMode === 'top' ? "default" : "outline"} 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => setCameraMode('top')}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="4" y="4" width="16" height="16" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Top View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={cameraMode === 'orbit' ? "default" : "outline"} 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => setCameraMode('orbit')}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="8" strokeWidth="2"/>
                        <path d="M12 4 L12 8 M12 16 L12 20 M4 12 L8 12 M16 12 L20 12" strokeWidth="2"/>
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Orbit View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={handleFitToView}
                    >
                      <Maximize2Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fit to View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={handleCameraReset}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M4 12a8 8 0 0 1 8-8V2l4 3-4 3V6a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z" strokeWidth="2"/>
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset Camera</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </Card>
        </div>
        
        {/* Right Controls */}
        <div className="flex flex-col gap-2">
          <Card className="p-2 pointer-events-auto bg-white/95 backdrop-blur-sm shadow-lg">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={handleTakeScreenshot}
            >
              <CameraIcon className="h-4 w-4 mr-2" />
              Screenshot
            </Button>
          </Card>

          {/* Statistics Panel */}
          {showStats && (
            <Card className="p-3 pointer-events-auto bg-white/95 backdrop-blur-sm shadow-lg">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700">Floor Statistics</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <HomeIcon className="h-3 w-3" />
                      Rooms
                    </span>
                    <Badge variant="secondary" className="text-xs">{objectCounts.rooms}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2"/>
                      </svg>
                      Hallways
                    </span>
                    <Badge variant="secondary" className="text-xs">{objectCounts.hallways}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <DoorOpenIcon className="h-3 w-3" />
                      Doors
                    </span>
                    <Badge variant="secondary" className="text-xs">{objectCounts.doors}</Badge>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Total Objects</span>
                    <Badge className="text-xs">{objectCounts.total}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none z-20">
        {/* View Mode Selector */}
        <Card className="p-2 pointer-events-auto bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'default' ? "default" : "outline"} 
                    size="sm" 
                    className="h-8 px-3 text-xs"
                    onClick={() => setViewMode('default')}
                  >
                    All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show All Objects</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'rooms' ? "default" : "outline"} 
                    size="sm" 
                    className="h-8 px-3 text-xs"
                    onClick={() => setViewMode('rooms')}
                  >
                    Rooms
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show Only Rooms</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'hallways' ? "default" : "outline"} 
                    size="sm" 
                    className="h-8 px-3 text-xs"
                    onClick={() => setViewMode('hallways')}
                  >
                    Hallways
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show Only Hallways</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={viewMode === 'doors' ? "default" : "outline"} 
                    size="sm" 
                    className="h-8 px-3 text-xs"
                    onClick={() => setViewMode('doors')}
                  >
                    Doors
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show Only Doors</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Card>

        {/* Lighting Intensity Control */}
        <Card className="p-3 pointer-events-auto bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-3">
            <SunIcon className="h-4 w-4 text-yellow-600" />
            <Slider 
              value={[lightIntensity]} 
              onValueChange={(value) => setLightIntensity(value[0])}
              min={0.2}
              max={2}
              step={0.1}
              className="w-32"
            />
            <span className="text-xs font-medium text-gray-700 w-8">
              {Math.round(lightIntensity * 100)}%
            </span>
          </div>
        </Card>
      </div>

      {/* Selected Object Info Panel */}
      {selectedObjectData && (
        <div className="absolute top-24 left-4 pointer-events-none z-20">
          <Card className="p-4 pointer-events-auto bg-white/95 backdrop-blur-sm shadow-xl max-w-sm animate-in slide-in-from-left">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MousePointerClickIcon className="h-4 w-4 text-blue-600" />
                    {selectedObjectData.label || selectedObjectData.properties?.room_number || 'Selected Object'}
                  </h3>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {selectedObjectData.type.charAt(0).toUpperCase() + selectedObjectData.type.slice(1)}
                  </Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onObjectSelect?.(null)}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" strokeWidth="2"/>
                  </svg>
                </Button>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {selectedObjectData.properties && Object.entries(selectedObjectData.properties).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-medium text-gray-900">{String(value)}</span>
                  </div>
                ))}
                
                {selectedObjectData.position && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className="font-medium text-gray-900 text-xs">
                        X: {Math.round(selectedObjectData.position.x)}, Y: {Math.round(selectedObjectData.position.y)}
                      </span>
                    </div>
                  </>
                )}

                {selectedObjectData.size && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium text-gray-900 text-xs">
                      {Math.round(selectedObjectData.size.width)} × {Math.round(selectedObjectData.size.height)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  <InfoIcon className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="2"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
                  </svg>
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
