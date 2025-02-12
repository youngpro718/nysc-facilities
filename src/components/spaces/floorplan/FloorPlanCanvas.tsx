
import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Group } from "fabric";
import { Card } from "@/components/ui/card";
import { DrawingMode, FloorPlanObject, LayerType } from "./types/floorPlanTypes";
import { createGrid, createRoom, createDoor, snapToGrid, updateObjectFromFloorPlan } from "./utils/canvasUtils";
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
  const canvasInstance = useRef<FabricCanvas | null>(null);
  const layerGroups = useRef<Record<LayerType, Group>>({} as any);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const { layers, objects, isLoading } = useFloorPlanData(floorId);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Cleanup previous instance
    if (canvasInstance.current) {
      canvasInstance.current.dispose();
    }

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f9fafb',
      selection: drawingMode === 'view'
    });

    // Set up event handlers
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:cleared', () => onObjectSelect?.(null));

    canvasInstance.current = canvas;

    return () => {
      canvas.dispose();
      canvasInstance.current = null;
    };
  }, []);

  // Handle mouse interactions
  const handleMouseDown = async (e: any) => {
    if (!canvasInstance.current || !e.pointer || !floorId) return;

    const pointer = e.pointer;
    const canvas = canvasInstance.current;

    if (drawingMode === 'draw') {
      setIsDrawing(true);
      setStartPoint({ x: pointer.x, y: pointer.y });

      // Start drawing a new room
      const room = createRoom({
        width: 0,
        height: 0,
        fill: 'rgba(226, 232, 240, 0.5)'
      });

      canvas.add(room);
      canvas.renderAll();
    } else if (drawingMode === 'door') {
      const door = createDoor({});
      const snappedX = snapToGrid(pointer.x, 20);
      const snappedY = snapToGrid(pointer.y, 20);
      
      door.set({ left: snappedX, top: snappedY });
      canvas.add(door);
      
      try {
        // Get or create doors layer
        let doorLayer = layers?.find(l => l.type === 'doors');
        if (!doorLayer) {
          const { data, error } = await supabase
            .from('floorplan_layers')
            .insert({
              floor_id: floorId,
              type: 'doors',
              name: 'Doors',
              order_index: 2,
              visible: true
            })
            .select()
            .single();
            
          if (error) throw error;
          doorLayer = data;
        }

        // Create door object
        const { data, error } = await supabase
          .from('floor_plan_objects')
          .insert({
            layer_id: doorLayer.id,
            floor_id: floorId,
            type: 'door',
            label: 'Door',
            position: { x: snappedX, y: snappedY },
            size: { width: 40, height: 10 },
            style: { fill: '#94a3b8', stroke: '#475569' }
          })
          .select()
          .single();

        if (error) throw error;
        (door as any).floorPlanObject = data;
        
        canvas.renderAll();
        toast.success('Door added successfully');
      } catch (error) {
        console.error('Error saving door:', error);
        canvas.remove(door);
        toast.error('Failed to add door');
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !startPoint || !canvasInstance.current || !e.pointer) return;

    const pointer = e.pointer;
    const canvas = canvasInstance.current;
    const activeObject = canvas.getActiveObject();
    
    if (activeObject && activeObject instanceof Group) {
      const width = snapToGrid(Math.abs(pointer.x - startPoint.x), 20);
      const height = snapToGrid(Math.abs(pointer.y - startPoint.y), 20);

      activeObject.set({
        width,
        height,
        scaleX: 1,
        scaleY: 1
      });

      canvas.renderAll();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !canvasInstance.current) return;

    setIsDrawing(false);
    setStartPoint(null);

    const canvas = canvasInstance.current;
    const activeObject = canvas.getActiveObject();
    
    if (activeObject) {
      activeObject.setCoords();
      canvas.renderAll();
    }
  };

  const handleSelection = (e: any) => {
    const selected = e.selected?.[0];
    if (selected?.floorPlanObject) {
      onObjectSelect?.(selected.floorPlanObject);
    }
  };

  // Update canvas when data changes
  useEffect(() => {
    if (!canvasInstance.current || !layers || !objects) return;

    const canvas = canvasInstance.current;
    canvas.clear();

    // Create grid
    const gridLines = createGrid(canvas, 20);
    gridLines.forEach(line => canvas.add(line));

    // Create and populate layers
    layers.forEach(layer => {
      const layerGroup = new Group([], {
        selectable: false,
        evented: false
      });
      layerGroups.current[layer.type] = layerGroup;
      canvas.add(layerGroup);
    });

    // Add objects to their respective layers
    objects.forEach(obj => {
      const layer = layers.find(l => l.id === obj.layer_id);
      if (!layer) return;

      const fabricObject = obj.type === 'door'
        ? createDoor({ label: obj.label })
        : createRoom({
            width: obj.size.width,
            height: obj.size.height,
            label: obj.label
          });

      updateObjectFromFloorPlan(fabricObject, obj);
      (fabricObject as any).floorPlanObject = obj;
      
      const layerGroup = layerGroups.current[layer.type];
      if (layerGroup) {
        layerGroup.addWithUpdate(fabricObject);
      }
    });

    canvas.renderAll();
  }, [layers, objects]);

  // Update selection mode based on drawing mode
  useEffect(() => {
    if (!canvasInstance.current) return;
    
    const canvas = canvasInstance.current;
    canvas.selection = drawingMode === 'view';
    canvas.getObjects().forEach((obj) => {
      if (obj instanceof Group && !(obj as any).isLayerGroup) {
        obj.selectable = drawingMode === 'view';
        obj.hasControls = drawingMode === 'view';
      }
    });
    canvas.renderAll();
  }, [drawingMode]);

  if (!floorId) {
    return (
      <Card className="p-4">
        <div className="h-[600px] w-full flex items-center justify-center bg-gray-50">
          Select a floor to view the floor plan
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

  return (
    <Card className="p-4">
      <canvas ref={canvasRef} className="border rounded-lg shadow-sm" />
    </Card>
  );
}
