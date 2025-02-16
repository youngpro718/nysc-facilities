
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FloorPlanNode, FloorPlanEdge, Position } from "../types/floorPlanTypes";
import { Json } from "@/integrations/supabase/types";

// Helper to safely parse position data from the database
function parsePosition(positionData: Json | null): Position {
  if (typeof positionData === 'object' && positionData !== null) {
    return {
      x: Number(positionData.x) || 0,
      y: Number(positionData.y) || 0
    };
  }
  return { x: 0, y: 0 };
}

// Helper to safely parse size data
function parseSize(sizeData: Json | null, type: string) {
  if (typeof sizeData === 'object' && sizeData !== null) {
    return {
      width: Number(sizeData.width) || (type === 'door' ? 60 : 150),
      height: Number(sizeData.height) || (type === 'door' ? 20 : 100)
    };
  }
  return {
    width: type === 'door' ? 60 : 150,
    height: type === 'door' ? 20 : 100
  };
}

export function useFloorPlanData(floorId: string | null) {
  const { data: objectsData, isLoading: isLoadingObjects } = useQuery({
    queryKey: ['floorplan-objects', floorId],
    queryFn: async () => {
      if (!floorId) return { objects: [], edges: [] };
      
      console.log('Fetching floor plan objects for floor:', floorId);
      
      const { data: floorObjects, error } = await supabase
        .from('floor_plan_objects')
        .select('*')
        .eq('floor_id', floorId);

      if (error) {
        console.error('Error fetching floor plan objects:', error);
        throw error;
      }

      console.log('Retrieved floor objects:', floorObjects);

      // Transform the objects to match our FloorPlanNode type
      const nodes: FloorPlanNode[] = (floorObjects || []).map(obj => {
        const position = parsePosition(obj.position);
        const size = parseSize(obj.size, obj.type);
        
        return {
          id: obj.id,
          type: obj.type,
          position: position,
          data: {
            label: obj.label || '',
            type: obj.type,
            size: size,
            style: typeof obj.style === 'object' ? obj.style : {
              backgroundColor: obj.type === 'door' ? '#94a3b8' : '#e2e8f0',
              border: obj.type === 'door' ? '2px solid #475569' : '1px solid #cbd5e1'
            },
            properties: typeof obj.properties === 'object' ? obj.properties : {}
          },
          rotation: Number(obj.rotation) || 0,
          zIndex: Number(obj.z_index) || 0
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
    objects: objectsData?.objects || [],
    edges: objectsData?.edges || [],
    isLoading: isLoadingObjects
  };
}
