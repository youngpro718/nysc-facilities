
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { FloorPlanLayerDB, FloorPlanNode, FloorPlanEdge, Position } from "../types/floorPlanTypes";
import { supabase } from "@/integrations/supabase/client";

// Type guard to check if an object is a valid Position
function isValidPosition(position: any): position is Position {
  return (
    position &&
    typeof position === 'object' &&
    'x' in position &&
    'y' in position &&
    typeof position.x === 'number' &&
    typeof position.y === 'number'
  );
}

// Helper to create a default position based on index
function createDefaultPosition(index: number): Position {
  return {
    x: (index % 3) * 250 + 100,
    y: Math.floor(index / 3) * 200 + 100
  };
}

export function useFloorPlanData(floorId: string | null) {
  // Query for layers
  const { data: layers, isLoading: isLoadingLayers } = useQuery({
    queryKey: ['floorplan-layers', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      const { data, error } = await supabase
        .from('floorplan_layers')
        .select('*')
        .eq('floor_id', floorId);
      
      if (error) throw error;
      return data.map(layer => transformLayer(layer as FloorPlanLayerDB));
    },
    enabled: !!floorId
  });

  // Query for floor plan objects and connections
  const { data: objectsData, isLoading: isLoadingObjects } = useQuery({
    queryKey: ['floorplan-objects', floorId],
    queryFn: async () => {
      if (!floorId) return { objects: [], edges: [] };
      
      console.log('Fetching floor plan objects for floor:', floorId);
      
      const { data: floorObjects, error } = await supabase
        .from('floor_plan_objects')
        .select('*')
        .eq('floor_id', floorId)
        .order('created_at');

      if (error) {
        console.error('Error fetching floor plan objects:', error);
        throw error;
      }

      console.log('Retrieved floor objects:', floorObjects);

      // Transform the objects to match our FloorPlanNode type
      const nodes: FloorPlanNode[] = (floorObjects || []).map((obj, index) => {
        // Handle position
        let parsedPosition: Position;
        try {
          const positionData = typeof obj.position === 'string' ? JSON.parse(obj.position) : obj.position;
          parsedPosition = isValidPosition(positionData) ? positionData : createDefaultPosition(index);
        } catch (e) {
          parsedPosition = createDefaultPosition(index);
        }

        // Handle size
        let parsedSize = { width: 150, height: 100 };
        try {
          const sizeData = typeof obj.size === 'string' ? JSON.parse(obj.size) : obj.size;
          if (sizeData && typeof sizeData === 'object' && 'width' in sizeData && 'height' in sizeData) {
            parsedSize = {
              width: Number(sizeData.width) || (obj.type === 'door' ? 60 : 150),
              height: Number(sizeData.height) || (obj.type === 'door' ? 20 : 100)
            };
          }
        } catch (e) {
          parsedSize = {
            width: obj.type === 'door' ? 60 : 150,
            height: obj.type === 'door' ? 20 : 100
          };
        }

        // Handle properties
        let parsedProperties = {};
        try {
          parsedProperties = typeof obj.properties === 'string' ? JSON.parse(obj.properties) : (obj.properties || {});
        } catch (e) {
          parsedProperties = {};
        }

        return {
          id: obj.id,
          type: obj.type,
          position: parsedPosition,
          data: {
            label: obj.label || '',
            type: obj.type,
            size: parsedSize,
            style: obj.style || {
              backgroundColor: obj.type === 'door' ? '#94a3b8' : '#e2e8f0',
              border: obj.type === 'door' ? '2px solid #475569' : '1px solid #cbd5e1'
            },
            properties: parsedProperties,
            rotation: obj.rotation || 0
          },
          rotation: obj.rotation || 0,
          zIndex: obj.type === 'door' ? 2 : obj.type === 'hallway' ? 1 : 0
        };
      });

      console.log('Transformed nodes:', nodes);

      return {
        objects: nodes,
        edges: [] as FloorPlanEdge[]
      };
    },
    enabled: !!floorId
  });

  return {
    layers: layers || [],
    objects: objectsData?.objects || [],
    edges: objectsData?.edges || [],
    isLoading: isLoadingLayers || isLoadingObjects
  };
}
