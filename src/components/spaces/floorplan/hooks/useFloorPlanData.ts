
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FloorPlanNode, FloorPlanEdge } from "../types/floorPlanTypes";

export function useFloorPlanData(floorId: string | null) {
  // Query for floor plan objects and connections
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
      const nodes: FloorPlanNode[] = (floorObjects || []).map(obj => ({
        id: obj.id,
        type: obj.type,
        position: obj.position || { x: 0, y: 0 },
        data: {
          label: obj.label || '',
          type: obj.type,
          size: obj.size || { width: obj.type === 'door' ? 60 : 150, height: obj.type === 'door' ? 20 : 100 },
          style: obj.style || {
            backgroundColor: obj.type === 'door' ? '#94a3b8' : '#e2e8f0',
            border: obj.type === 'door' ? '2px solid #475569' : '1px solid #cbd5e1'
          },
          properties: obj.properties || {}
        },
        rotation: obj.rotation || 0,
        zIndex: obj.z_index || 0
      }));

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
