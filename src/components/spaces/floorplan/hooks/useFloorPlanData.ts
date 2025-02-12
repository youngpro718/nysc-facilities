
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FloorPlanLayer, FloorPlanObject, FloorPlanLayerDB } from "../types/floorPlanTypes";

function transformLayer(raw: FloorPlanLayerDB): FloorPlanLayer {
  const parsedData = typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data;
  
  return {
    id: raw.id,
    floor_id: raw.floor_id,
    type: raw.type,
    name: raw.name,
    order_index: raw.order_index,
    visible: raw.visible,
    data: parsedData || {}
  };
}

function transformObject(raw: any): FloorPlanObject {
  return {
    ...raw,
    position: typeof raw.position === 'string' ? JSON.parse(raw.position) : raw.position,
    size: typeof raw.size === 'string' ? JSON.parse(raw.size) : raw.size,
    style: typeof raw.style === 'string' ? JSON.parse(raw.style) : raw.style || {},
    properties: typeof raw.properties === 'string' ? JSON.parse(raw.properties) : raw.properties || {}
  };
}

export function useFloorPlanData(floorId: string | null) {
  const { data: layers, isLoading: isLoadingLayers } = useQuery({
    queryKey: ['floorplan-layers', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      const { data, error } = await supabase
        .from('floorplan_layers')
        .select('*')
        .eq('floor_id', floorId)
        .order('order_index');
        
      if (error) throw error;
      return (data || []).map(layer => transformLayer(layer as FloorPlanLayerDB));
    },
    enabled: !!floorId
  });

  const { data: objects, isLoading: isLoadingObjects } = useQuery({
    queryKey: ['floorplan-objects', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      const { data, error } = await supabase
        .from('floor_plan_objects')
        .select('*')
        .eq('floor_id', floorId);
        
      if (error) throw error;
      return (data || []).map(transformObject);
    },
    enabled: !!floorId
  });

  return {
    layers,
    objects,
    isLoading: isLoadingLayers || isLoadingObjects
  };
}
