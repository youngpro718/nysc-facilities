import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Canvas } from '@react-three/fiber';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useFloorPlanData } from '../hooks/useFloorPlanData';
import { toast } from 'sonner';
import { 
  InfoIcon, 
  Maximize2Icon, 
  Building2Icon,
  HomeIcon,
  BookIcon,
  EyeIcon,
  EyeOffIcon,
  SunIcon
} from 'lucide-react';
import { ThreeDScene } from '../three-d/ThreeDScene';
import { Button } from '@/components/ui/button';
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
  const [showConnections, setShowConnections] = useState<boolean>(true);
  const [lightIntensity, setLightIntensity] = useState<number>(0.8);
  const [viewMode, setViewMode] = useState<'default' | 'rooms' | 'hallways' | 'doors'>('default');
  const canvasRef = useRef<any>(null);

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
        
        toast.success(`Selected ${selectedObj.type}: ${selectedObj.data.label || 'Unnamed'}`);
      }
    }
  };

  const handleCanvasError = (error: any) => {
    console.error('Canvas error:', error);
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
      console.error('Screenshot error:', err);
      toast.error('Failed to take screenshot');
    }
  };

  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    toast.info(focusMode ? 'Focus mode disabled' : 'Focus mode enabled');
  };

  const CanvasWrapper = () => {
    return (
      <ErrorBoundary>
        <Canvas
          shadows
          gl={{ 
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true
          }}
          camera={{ 
            position: [0, 600, 600] as [number, number, number], 
            fov: 45,
            near: 0.1,
            far: 2000
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <ThreeDScene 
            objects={objects || []} 
            connections={edges || []} 
            onObjectSelect={handleObjectSelect}
            selectedObjectId={selectedObjectId}
            showLabels={showLabels}
            showConnections={showConnections}
            lightIntensity={lightIntensity}
            previewData={previewData}
            viewMode={viewMode}
          />
        </Canvas>
      </ErrorBoundary>
    );
  };

  if (!floorId) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center space-y-2">
          <Building2Icon className="h-12 w-12 mx-auto text-gray-400" />
          <p className="text-gray-500">Select a floor to view the 3D model</p>
          <Button variant="outline" size="sm" onClick={() => toast.info('Please select a floor first')}>
            <InfoIcon className="h-4 w-4 mr-2" />
            Floor Selection Required
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          <p className="text-gray-500">Loading 3D model...</p>
          <p className="text-xs text-gray-400">Preparing spaces and connections</p>
        </div>
      </Card>
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

  const objectCounts = {
    rooms: objects.filter(obj => obj.type === 'room').length,
    hallways: objects.filter(obj => obj.type === 'hallway').length,
    doors: objects.filter(obj => obj.type === 'door').length,
    connections: edges.length
  };

  return (
    <Card className={`w-full h-full overflow-hidden relative ${focusMode ? 'bg-black' : ''}`}>
      {isMounted && <CanvasWrapper />}
      {/* Enhanced UI controls panel */}
      <div className={`absolute bottom-4 right-4 ${focusMode ? 'opacity-30 hover:opacity-100' : 'opacity-100'} transition-opacity bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100`}>
        <div className="mb-3 flex justify-between items-center border-b pb-2">
          <span className="text-sm font-medium text-gray-900">Floor Plan Viewer</span>
          <div className="flex gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => setShowLabels(!showLabels)}
                  >
                    {showLabels ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showLabels ? "Hide labels" : "Show labels"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={toggleFocusMode}
                  >
                    <Maximize2Icon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{focusMode ? "Exit focus mode" : "Enter focus mode"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={handleTakeScreenshot}
                  >
                    <BookIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Take Screenshot</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* View filter options */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Button 
            variant={viewMode === 'default' ? "default" : "outline"} 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => setViewMode('default')}
          >
            All ({objectCounts.rooms + objectCounts.hallways + objectCounts.doors})
          </Button>
          <Button 
            variant={viewMode === 'rooms' ? "default" : "outline"} 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => setViewMode('rooms')}
          >
            <HomeIcon className="h-3 w-3 mr-1" />
            Rooms ({objectCounts.rooms})
          </Button>
          <Button 
            variant={viewMode === 'hallways' ? "default" : "outline"} 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => setViewMode('hallways')}
          >
            Hallways ({objectCounts.hallways})
          </Button>
          <Button 
            variant={viewMode === 'doors' ? "default" : "outline"} 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => setViewMode('doors')}
          >
            Doors ({objectCounts.doors})
          </Button>
        </div>
        
        {/* Additional controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-600 whitespace-nowrap">Connections:</span>
            <Button 
              variant={showConnections ? "default" : "outline"} 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => setShowConnections(!showConnections)}
            >
              {showConnections ? "Visible" : "Hidden"}
            </Button>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-100 rounded px-1">
                <span className="text-xs text-gray-600 whitespace-nowrap flex items-center">
                  <SunIcon className="h-3 w-3 mr-1 text-amber-500" />
                  Lighting:
                </span>
                <div className="bg-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-700">
                  {Math.round(lightIntensity * 100)}%
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Adjust Lighting</h4>
                <Slider
                  defaultValue={[lightIntensity * 100]}
                  max={150}
                  step={5}
                  onValueChange={(values) => setLightIntensity(values[0] / 100)}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Dim</span>
                  <span>Bright</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>Rooms</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>Hallways</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Doors</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
              <span>Direct</span>
              <span className="w-3 h-3 rounded-sm bg-amber-500 ml-2"></span>
              <span>Door</span>
              <span className="w-3 h-3 rounded-sm bg-red-500 ml-2"></span>
              <span>Emergency</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
