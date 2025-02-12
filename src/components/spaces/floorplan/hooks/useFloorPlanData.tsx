
import { useQuery } from "@tanstack/react-query";
import { transformLayer } from "../utils/layerTransforms";
import { FloorPlanLayerDB, FloorPlanNode, FloorPlanEdge } from "../types/floorPlanTypes";
import { supabase } from "@/integrations/supabase/client";

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
      
      const { data: floorObjects, error } = await supabase
        .from('floor_plan_objects')
        .select('*')
        .eq('floor_id', floorId);

      if (error) throw error;

      // Transform the objects to match our FloorPlanNode type
      const nodes: FloorPlanNode[] = floorObjects.map(obj => ({
        id: obj.id,
        type: obj.type,
        position: obj.position || { x: 0, y: 0 },
        data: {
          label: obj.label || '',
          type: obj.type,
          size: obj.size || { width: 150, height: 100 },
          style: obj.style || {},
          properties: obj.properties || {},
          rotation: obj.rotation || 0
        },
        rotation: obj.rotation || 0,
        zIndex: obj.z_index || 0
      }));

      // For now, return empty edges array since we'll implement connections later
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
