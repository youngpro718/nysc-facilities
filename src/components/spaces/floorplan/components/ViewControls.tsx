
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RefreshCw, 
  Search,
  Filter,
  Eye,
  EyeOff,
  Grid3X3,
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
  onAdvancedSearch?: () => void;
  /** When true, render as a floating overlay for the canvas */
  floating?: boolean;
}

function ControlButton({ 
  onClick, 
  disabled, 
  active, 
  tooltip, 
  children 
}: { 
  onClick: () => void; 
  disabled?: boolean; 
  active?: boolean; 
  tooltip: string; 
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn("h-7 w-7 px-0", active && "bg-accent")}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
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
  onSearch,
  onAdvancedSearch,
  floating = false,
}: ViewControlsProps) {
  const isMobile = useIsMobile();

  // Floating version: minimal zoom bar rendered over the canvas
  if (floating) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-lg p-0.5 shadow-md border border-border">
          <ControlButton onClick={onZoomOut} disabled={zoom <= 0.25} tooltip="Zoom Out">
            <ZoomOut className="h-3.5 w-3.5" />
          </ControlButton>

          <span className="text-[10px] px-1 min-w-[2rem] text-center font-medium text-muted-foreground select-none">
            {(zoom * 100).toFixed(0)}%
          </span>

          <ControlButton onClick={onZoomIn} disabled={zoom >= 3} tooltip="Zoom In">
            <ZoomIn className="h-3.5 w-3.5" />
          </ControlButton>

          <ControlButton onClick={onZoomReset} tooltip="Fit to View">
            <Maximize className="h-3.5 w-3.5" />
          </ControlButton>

          {!isMobile && (
            <>
              <div className="h-4 w-px bg-border" />
              <ControlButton onClick={onToggleLabels} active={showLabels} tooltip={`${showLabels ? 'Hide' : 'Show'} Labels`}>
                {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </ControlButton>
              <ControlButton onClick={onToggleGrid} active={showGrid} tooltip={`${showGrid ? 'Hide' : 'Show'} Grid`}>
                <Grid3X3 className="h-3.5 w-3.5" />
              </ControlButton>
            </>
          )}

          <div className="h-4 w-px bg-border" />

          <ControlButton onClick={onToggleFullscreen} tooltip={`${isFullscreen ? 'Exit' : 'Enter'} Fullscreen`}>
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
          </ControlButton>
        </div>
      </TooltipProvider>
    );
  }

  // Inline header version (desktop only)
  if (isMobile) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-border">
        <ControlButton onClick={onSearch} tooltip="Quick Search">
          <Search className="h-3.5 w-3.5" />
        </ControlButton>

        {onAdvancedSearch && (
          <ControlButton onClick={onAdvancedSearch} tooltip="Advanced Search">
            <Filter className="h-3.5 w-3.5" />
          </ControlButton>
        )}

        <div className="h-4 w-px bg-border" />

        <ControlButton onClick={onRefresh} tooltip="Refresh">
          <RefreshCw className="h-3.5 w-3.5" />
        </ControlButton>
      </div>
    </TooltipProvider>
  );
}
