
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Space } from "../../types/SpaceTypes";

export function useSpacesQuery(floorId: string | null) {
  return useQuery({
    queryKey: ['spaces', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      console.log('Fetching spaces for floor:', floorId);
      
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          id,
          name,
          type,
          status,
          floor_id,
          room_number,
          position,
          size,
          rotation,
          created_at,
          updated_at,
          subtype
        `)
        .eq('floor_id', floorId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching spaces:', error);
        throw error;
      }

      return data as Space[];
    },
    enabled: !!floorId
  });
}
