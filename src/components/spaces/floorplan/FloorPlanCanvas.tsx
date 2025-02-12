
import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, Rect } from "fabric";
import { Card } from "@/components/ui/card";
import { FloorPlanObject, DrawingMode } from "./types/floorPlanTypes";
import { createGrid, createRoomGroup, createDoor } from "./utils/canvasUtils";
import { useFloorPlanData } from "./hooks/useFloorPlanData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FloorPlanCanvasProps {
  floorId: string | null;
  zoom?: number;
  drawingMode: DrawingMode;
  onObjectSelect?: (object: FloorPlanObject | null) => void;
}

export function FloorPlanCanvas({ floorId, zoom = 1, drawingMode, onObjectSelect }: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [activeRect, setActiveRect] = useState<Rect | null>(null);

  const { data: floorPlanObjects, isLoading, error } = useFloorPlanData(floorId);

  // Cleanup function to properly dispose of canvas
  const cleanupCanvas = useCallback(() => {
    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }
    setIsInitialized(false);
  }, []);

  // Initialize canvas when component mounts or floorId changes
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log('Initializing canvas for floor:', floorId);
    
    // Clean up existing canvas
    cleanupCanvas();

    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f9fafb',
      selection: drawingMode === 'view'
    });

    // Selection events
    canvas.on('selection:created', (e) => {
      const selected = e.selected?.[0] as any;
      if (selected?.customData) {
        onObjectSelect?.(selected.customData);
      }
    });

    canvas.on('selection:cleared', () => {
      onObjectSelect?.(null);
    });

    // Mouse events for drawing
    canvas.on('mouse:down', async (e) => {
      if (!e.pointer || !floorId) return;

      if (drawingMode === 'draw') {
        setIsDrawing(true);
        const pointer = canvas.getPointer(e.e);
        setStartPoint({ x: pointer.x, y: pointer.y });

        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: 'rgba(226, 232, 240, 0.5)',
          stroke: '#94a3b8',
          strokeWidth: 2,
          selectable: false
        });

        canvas.add(rect);
        setActiveRect(rect);
        canvas.renderAll();
      } else if (drawingMode === 'door') {
        const pointer = canvas.getPointer(e.e);
        console.log('Adding door at:', pointer);
        const door = createDoor(pointer.x, pointer.y);
        canvas.add(door);
        
        try {
          const { data, error } = await supabase
            .from('floor_plan_objects')
            .insert({
              floor_id: floorId,
              object_type: 'door',
              position_x: Math.round(pointer.x),
              position_y: Math.round(pointer.y),
              width: 40,
              height: 10,
              properties: { name: 'New Door' }
            })
            .select()
            .single();

          if (error) throw error;
          
          (door as any).customData = data;
          canvas.renderAll();
          toast.success('Door added successfully');
        } catch (error) {
          console.error('Error saving door:', error);
          canvas.remove(door);
          toast.error('Failed to add door');
        }
      }
    });

    canvas.on('mouse:move', (e) => {
      if (!isDrawing || !startPoint || !activeRect || !e.pointer) return;

      const pointer = canvas.getPointer(e.e);
      const width = Math.abs(pointer.x - startPoint.x);
      const height = Math.abs(pointer.y - startPoint.y);

      // Snap to grid
      const gridSize = 20;
      const snappedWidth = Math.round(width / gridSize) * gridSize;
      const snappedHeight = Math.round(height / gridSize) * gridSize;

      activeRect.set({
        width: snappedWidth,
        height: snappedHeight
      });

      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      if (!isDrawing || !activeRect) return;

      setIsDrawing(false);
      setStartPoint(null);
      
      activeRect.set({
        selectable: true,
        hasControls: true
      });

      setActiveRect(null);
      canvas.renderAll();
    });

    fabricRef.current = canvas;
    setIsInitialized(true);

    return () => {
      cleanupCanvas();
    };
  }, [floorId, drawingMode, onObjectSelect, cleanupCanvas]);

  // Update zoom level
  useEffect(() => {
    if (!fabricRef.current || !isInitialized) return;
    
    const canvas = fabricRef.current;
    const center = canvas.getCenter();
    canvas.setViewportTransform([zoom, 0, 0, zoom, center.left, center.top]);
    canvas.renderAll();
  }, [zoom, isInitialized]);

  // Add objects to canvas when data is loaded
  useEffect(() => {
    if (!fabricRef.current || !floorPlanObjects || !isInitialized) return;
    
    const canvas = fabricRef.current;
    
    // Clear existing objects
    canvas.getObjects().forEach(obj => canvas.remove(obj));
    
    // Create grid
    createGrid(canvas, 20);

    // Add floor plan objects
    floorPlanObjects.forEach(obj => {
      const group = createRoomGroup(obj);
      if (group) {
        canvas.add(group);
        group.setCoords();
      }
    });

    // Update viewport
    const center = canvas.getCenter();
    canvas.setViewportTransform([zoom, 0, 0, zoom, center.left, center.top]);
    canvas.renderAll();
  }, [floorPlanObjects, isInitialized, zoom]);

  // Update selection mode based on drawing mode
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    canvas.selection = drawingMode === 'view';
    canvas.getObjects().forEach((obj) => {
      obj.selectable = drawingMode === 'view';
      obj.hasControls = drawingMode === 'view';
    });
    canvas.renderAll();
  }, [drawingMode]);

  if (error) {
    return (
      <Card className="p-4">
        <div className="h-[600px] w-full flex items-center justify-center bg-gray-50 text-red-500">
          Error loading floor plan: {error.message}
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
