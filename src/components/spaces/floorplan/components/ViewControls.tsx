import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RefreshCw, 
  Settings, 
  Search,
  Eye,
  EyeOff,
  Expand,
  Minimize
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ViewControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onRefresh: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSearch: () => void;
}

export function ViewControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onRefresh,
  showLabels,
  onToggleLabels,
  showGrid,
  onToggleGrid,
  isFullscreen,
  onToggleFullscreen,
  onSearch
}: ViewControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSearch}
              className="h-7 w-7 px-0"
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search</TooltipContent>
        </Tooltip>

        <div className="h-4 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomOut}
              disabled={zoom <= 0.25}
              className="h-7 w-7 px-0"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>

        <span className="text-xs px-1 min-w-[2.5rem] text-center font-medium">
          {(zoom * 100).toFixed(0)}%
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomIn}
              disabled={zoom >= 3}
              className="h-7 w-7 px-0"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomReset}
              className="h-7 w-7 px-0"
            >
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset Zoom</TooltipContent>
        </Tooltip>

        <div className="h-4 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleLabels}
              className={cn(
                "h-7 w-7 px-0",
                showLabels && "bg-primary/10"
              )}
            >
              {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{showLabels ? 'Hide' : 'Show'} Labels</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleGrid}
              className={cn(
                "h-7 w-7 px-0",
                showGrid && "bg-primary/10"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{showGrid ? 'Hide' : 'Show'} Grid</TooltipContent>
        </Tooltip>

        <div className="h-4 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-7 w-7 px-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
              className="h-7 w-7 px-0"
            >
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isFullscreen ? 'Exit' : 'Enter'} Fullscreen</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
