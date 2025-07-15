import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ZoomIn, 
  ZoomOut, 
  Grid3X3, 
  Link, 
  Unlink, 
  RotateCw,
  Move,
  Eye,
  EyeOff 
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SimpleControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  onToggleGrid: () => void;
  onToggleConnections: () => void;
  onToggleLabels: () => void;
  gridEnabled: boolean;
  connectionsVisible: boolean;
  labelsVisible: boolean;
  selectedObjectId?: string | null;
  onRotateSelected?: () => void;
  onMoveMode?: () => void;
  isConnecting?: boolean;
  onCancelConnection?: () => void;
}

export function SimpleControls({
  onZoomIn,
  onZoomOut,
  onFitToView,
  onToggleGrid,
  onToggleConnections,
  onToggleLabels,
  gridEnabled,
  connectionsVisible,
  labelsVisible,
  selectedObjectId,
  onRotateSelected,
  onMoveMode,
  isConnecting,
  onCancelConnection
}: SimpleControlsProps) {
  const [activeMode, setActiveMode] = useState<'select' | 'move' | 'connect'>('select');

  const handleModeChange = (mode: 'select' | 'move' | 'connect') => {
    setActiveMode(mode);
    if (mode === 'move' && onMoveMode) {
      onMoveMode();
    }
  };

  return (
    <Card className="absolute top-4 left-4 p-3 bg-card/95 backdrop-blur-sm">
      <div className="flex flex-col gap-2">
        {/* View Controls */}
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onZoomIn}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom In</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onZoomOut}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFitToView}
                  className="h-8 w-8 p-0"
                >
                  <Move className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Fit to View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Mode Controls */}
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeMode === 'move' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('move')}
                  className="h-8 w-8 p-0"
                >
                  <Move className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Move Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeMode === 'connect' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('connect')}
                  className="h-8 w-8 p-0"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Connect Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Object Controls */}
        {selectedObjectId && (
          <div className="flex gap-1 border-t pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRotateSelected}
                    className="h-8 w-8 p-0"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rotate Selected</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Toggle Controls */}
        <div className="flex gap-1 border-t pt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={gridEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={onToggleGrid}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Grid</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={connectionsVisible ? 'default' : 'outline'}
                  size="sm"
                  onClick={onToggleConnections}
                  className="h-8 w-8 p-0"
                >
                  {connectionsVisible ? <Link className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Connections</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={labelsVisible ? 'default' : 'outline'}
                  size="sm"
                  onClick={onToggleLabels}
                  className="h-8 w-8 p-0"
                >
                  {labelsVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Labels</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Connection Mode Indicator */}
        {isConnecting && (
          <div className="border-t pt-2">
            <div className="text-xs text-muted-foreground mb-1">
              Connecting spaces...
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancelConnection}
              className="h-6 text-xs"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}