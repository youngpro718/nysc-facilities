
import { useEffect, useRef, useState } from "react";
import { Canvas } from "fabric";
import { Card } from "@/components/ui/card";
import { FloorPlanObject } from "./types/floorPlanTypes";
import { createGrid, createRoomGroup } from "./utils/canvasUtils";
import { useFloorPlanData } from "./hooks/useFloorPlanData";

interface FloorPlanCanvasProps {
  floorId: string | null;
  zoom?: number;
  onObjectSelect?: (object: FloorPlanObject | null) => void;
}

export function FloorPlanCanvas({ floorId, zoom = 1, onObjectSelect }: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: floorPlanObjects, isLoading, error } = useFloorPlanData(floorId);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f9fafb',
      preserveObjectStacking: true,
      selection: true
    });

    canvas.on('selection:created', (e) => {
      const group = e.selected?.[0] as any;
      if (group?.customData) {
        onObjectSelect?.(group.customData);
      }
    });

    canvas.on('selection:cleared', () => {
      onObjectSelect?.(null);
    });

    fabricRef.current = canvas;
    setIsInitialized(true);

    // Return cleanup function
    return () => {
      if (fabricRef.current) {
        // Remove event listeners first
        fabricRef.current.off();
        
        // Clear selection and objects
        try {
          fabricRef.current.discardActiveObject();
          fabricRef.current.clear();
          fabricRef.current.renderAll();
        } catch (e) {
          console.error('Error during canvas cleanup:', e);
        }

        // Dispose canvas last
        try {
          fabricRef.current.dispose();
        } catch (e) {
          console.error('Error disposing canvas:', e);
        }

        fabricRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [onObjectSelect]);

  // Update zoom
  useEffect(() => {
    if (!fabricRef.current || !isInitialized) return;
    
    try {
      const canvas = fabricRef.current;
      const center = canvas.getCenter();
      
      canvas.setViewportTransform([zoom, 0, 0, zoom, center.left, center.top]);
      canvas.renderAll();
    } catch (error) {
      console.error('Error updating zoom:', error);
    }
  }, [zoom, isInitialized]);

  // Add objects to canvas
  useEffect(() => {
    if (!fabricRef.current || !floorPlanObjects || !isInitialized) return;
    
    try {
      const canvas = fabricRef.current;
      
      // Clear existing objects
      canvas.clear();
      
      // Create grid and add new objects
      createGrid(canvas, 20);

      floorPlanObjects.forEach(obj => {
        const group = createRoomGroup(obj);
        if (group && canvas) {
          canvas.add(group);
          group.setCoords();
        }
      });

      // Center the view
      const center = canvas.getCenter();
      canvas.setViewportTransform([zoom, 0, 0, zoom, center.left, center.top]);
      canvas.renderAll();
    } catch (error) {
      console.error('Error adding objects to canvas:', error);
    }
  }, [floorPlanObjects, isInitialized, zoom]);

  if (error) {
    return (
      <Card className="p-4">
        <div className="h-[600px] w-full flex items-center justify-center bg-gray-50 text-red-500">
          Error loading floor plan
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="h-[600px] w-full flex items-center justify-center bg-gray-50">
          Loading floor plan...
        </div>
      </Card>
    );
  }

  if (!floorId) {
    return (
      <Card className="p-4">
        <div className="h-[600px] w-full flex items-center justify-center bg-gray-50">
          Select a floor to view the floor plan
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <canvas ref={canvasRef} className="border rounded-lg shadow-sm" />
    </Card>
  );
}
