import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid, LayoutGrid, Magnet } from 'lucide-react';

interface LayoutToolsProps {
  gridEnabled: boolean;
  snapToGridEnabled: boolean;
  autoLayoutEnabled: boolean;
  onToggleGrid: () => void;
  onToggleSnapToGrid: () => void;
  onToggleAutoLayout: () => void;
}

export function LayoutTools({
  gridEnabled,
  snapToGridEnabled,
  autoLayoutEnabled,
  onToggleGrid,
  onToggleSnapToGrid,
  onToggleAutoLayout
}: LayoutToolsProps) {
  return (
    <div className="flex gap-2">
      <Button 
        variant={gridEnabled ? "default" : "outline"} 
        size="icon" 
        onClick={onToggleGrid}
        title="Toggle Grid"
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button 
        variant={snapToGridEnabled ? "default" : "outline"} 
        size="icon" 
        onClick={onToggleSnapToGrid}
        title="Toggle Snap to Grid"
      >
        <Magnet className="h-4 w-4" />
      </Button>
      <Button 
        variant={autoLayoutEnabled ? "default" : "outline"} 
        size="icon" 
        onClick={onToggleAutoLayout}
        title="Toggle Auto Layout"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
