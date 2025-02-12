
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

  const cleanupCanvas = useCallback(() => {
    console.log('Cleaning up canvas...', fabricRef.current ? 'Canvas exists' : 'No canvas');
    if (fabricRef.current) {
      try {
        // Remove all event listeners
        fabricRef.current.off();
        // Clear all objects
        fabricRef.current.clear();
        // Dispose the canvas
        fabricRef.current.dispose();
        console.log('Canvas cleaned up successfully');
      } catch (err) {
        console.error('Error cleaning up canvas:', err);
      }
      fabricRef.current = null;
    }
    setIsInitialized(false);
  }, []);

  // Initialize canvas
  useEffect(() => {
    console.log('Initializing canvas effect triggered');
    
    const initCanvas = () => {
      console.log('Starting canvas initialization...');
      if (!canvasRef.current) {
        console.log('Canvas ref not ready');
        return;
      }
      
      if (fabricRef.current) {
        console.log('Canvas already exists, cleaning up first');
        cleanupCanvas();
      }

      console.log('Creating new canvas instance');
      const canvas = new Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#f9fafb',
        preserveObjectStacking: true,
        selection: true
      });

      // Selection events
      canvas.on('selection:created', (e) => {
        console.log('Selection created:', e.selected?.[0]);
        const group = e.selected?.[0] as any;
        if (group?.customData) {
          onObjectSelect?.(group.customData);
        }
      });

      canvas.on('selection:cleared', () => {
        console.log('Selection cleared');
        onObjectSelect?.(null);
      });

      // Mouse events
      canvas.on('mouse:down', async (e) => {
        if (!e.pointer) return;
        console.log('Mouse down event:', drawingMode);

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
        } else if (drawingMode === 'door' && floorId) {
          const pointer = canvas.getPointer(e.e);
          console.log('Creating door at:', pointer);
          const door = createDoor(pointer.x, pointer.y);
          canvas.add(door);
          
          try {
            const doorId = crypto.randomUUID();
            
            const { data, error } = await supabase
              .from('floor_plan_objects')
              .insert({
                floor_id: floorId,
                object_id: doorId,
                object_type: 'door',
                connection_type: 'door',
                position_x: Math.round(pointer.x),
                position_y: Math.round(pointer.y),
                width: 40,
                height: 10,
                properties: { name: 'New Door' },
                metadata: {},
                connected_to: []
              })
              .select()
              .single();

            if (error) throw error;
            
            (door as any).customData = data;
            canvas.renderAll();
            toast.success('Door placed successfully');
          } catch (error) {
            console.error('Error saving door:', error);
            canvas.remove(door);
            toast.error('Failed to place door');
          }
        }
      });

      canvas.on('mouse:move', (e) => {
        if (!isDrawing || !startPoint || !activeRect || !e.pointer) return;

        const pointer = canvas.getPointer(e.e);
        const width = Math.abs(pointer.x - startPoint.x);
        const height = Math.abs(pointer.y - startPoint.y);

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
        console.log('Mouse up event - finishing drawing');

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
      console.log('Canvas initialized successfully');
      setIsInitialized(true);
    };

    initCanvas();

    return () => {
      console.log('Canvas component unmounting');
      cleanupCanvas();
    };
  }, []); // Empty dependency array as we only want to initialize once

  // Update zoom
  useEffect(() => {
    if (!fabricRef.current || !isInitialized) return;
    console.log('Updating zoom:', zoom);
    
    const canvas = fabricRef.current;
    const center = canvas.getCenter();
    canvas.setViewportTransform([zoom, 0, 0, zoom, center.left, center.top]);
    canvas.renderAll();
  }, [zoom, isInitialized]);

  // Add objects to canvas
  useEffect(() => {
    if (!fabricRef.current || !floorPlanObjects || !isInitialized) {
      console.log('Skipping objects update:', {
        hasCanvas: !!fabricRef.current,
        hasObjects: !!floorPlanObjects,
        isInitialized
      });
      return;
    }
    
    console.log('Updating canvas objects:', floorPlanObjects.length);
    const canvas = fabricRef.current;
    canvas.clear();
    
    createGrid(canvas, 20);

    floorPlanObjects.forEach(obj => {
      const group = createRoomGroup(obj);
      if (group) {
        canvas.add(group);
        group.setCoords();
      }
    });

    const center = canvas.getCenter();
    canvas.setViewportTransform([zoom, 0, 0, zoom, center.left, center.top]);
    canvas.renderAll();
  }, [floorPlanObjects, isInitialized, zoom]);

  // Update selection mode based on drawing mode
  useEffect(() => {
    if (!fabricRef.current) return;
    console.log('Updating drawing mode:', drawingMode);
    
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
