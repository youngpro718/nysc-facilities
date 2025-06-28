
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SpaceOption } from "../../forms/room/connections/types";

export function useSpacesQuery(floorId: string) {
  return useQuery({
    queryKey: ["spaces-for-connections", floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      // Fetch all active spaces from the floor
      const { data: spaceData, error: spaceError } = await supabase
        .from("new_spaces")
        .select(`
          id,
          name,
          type,
          room_number,
          status
        `)
        .eq("floor_id", floorId)
        .neq("status", "inactive");
      
      if (spaceError) {
        console.error("Error fetching spaces for connections:", spaceError);
        throw spaceError;
      }
      
      // Format spaces for dropdown
      const formattedSpaces: SpaceOption[] = (spaceData || []).map(space => ({
        id: space.id,
        name: space.name,
        type: space.type,
        room_number: space.room_number
      }));
      
      return formattedSpaces;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!floorId,
    retry: 3
  });
}
