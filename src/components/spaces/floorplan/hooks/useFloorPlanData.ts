
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FloorPlanObject } from "../types/floorPlanTypes";

export function useFloorPlanData(floorId: string | null) {
  return useQuery({
    queryKey: ['floorPlanObjects', floorId],
    queryFn: async () => {
      if (!floorId) return [];

      console.log('Fetching floor plan data for floor:', floorId);

      const { data: objects, error } = await supabase
        .from('floor_plan_objects')
        .select(`
          *,
          rooms!inner(
            name,
            room_number,
            room_type,
            status
          )
        `)
        .eq('floor_id', floorId)
        .eq('object_type', 'room');
        
      if (error) {
        console.error('Error fetching floor plan data:', error);
        throw error;
      }
      
      console.log('Retrieved floor plan objects:', objects);
      return objects as FloorPlanObject[];
    },
    enabled: !!floorId
  });
}
