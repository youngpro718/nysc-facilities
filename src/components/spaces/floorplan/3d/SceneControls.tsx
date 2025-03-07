
import React from 'react';
import { Button } from "@/components/ui/button";
import { Maximize, Home, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface SceneControlsProps {
  onReset: () => void;
}

export function SceneControls({ onReset }: SceneControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
      <Button variant="outline" size="icon" className="bg-white" onClick={onReset}>
        <Home className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="bg-white">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="bg-white">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="bg-white">
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="bg-white">
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
