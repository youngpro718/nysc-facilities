
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
        // Parse position and size from JSON strings if needed
        let position = obj.position;
        try {
          if (typeof position === 'string') {
            position = JSON.parse(position);
          }
        } catch (e) {
          // If parsing fails, calculate grid position
          position = {
            x: (index % 3) * 250 + 100,
            y: Math.floor(index / 3) * 200 + 100
          };
        }

        let size = obj.size;
        try {
          if (typeof size === 'string') {
            size = JSON.parse(size);
          }
        } catch (e) {
          size = { 
            width: obj.type === 'door' ? 60 : 150, 
            height: obj.type === 'door' ? 20 : 100 
          };
        }

        // Parse properties from JSON string if needed
        let properties = obj.properties;
        try {
          if (typeof properties === 'string') {
            properties = JSON.parse(properties);
          }
        } catch (e) {
          properties = {};
        }

        return {
          id: obj.id,
          type: obj.type,
          position: position || { 
            x: (index % 3) * 250 + 100,
            y: Math.floor(index / 3) * 200 + 100
          },
          data: {
            label: obj.label || '',
            type: obj.type,
            size: size || { 
              width: obj.type === 'door' ? 60 : 150,
              height: obj.type === 'door' ? 20 : 100 
            },
            style: obj.style || {
              backgroundColor: obj.type === 'door' ? '#94a3b8' : '#e2e8f0',
              border: obj.type === 'door' ? '2px solid #475569' : '1px solid #cbd5e1'
            },
            properties: properties || {},
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
