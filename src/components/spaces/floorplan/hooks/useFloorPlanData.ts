
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FloorPlanLayer, FloorPlanObject } from "../types/floorPlanTypes";

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
      return data as FloorPlanLayer[];
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
      return data as FloorPlanObject[];
    },
    enabled: !!floorId
  });

  return {
    layers,
    objects,
    isLoading: isLoadingLayers || isLoadingObjects
  };
}
