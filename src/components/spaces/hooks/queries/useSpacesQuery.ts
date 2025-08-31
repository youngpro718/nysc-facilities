
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { SpaceOption } from "../../forms/room/connections/types";

export function useSpacesQuery(floorId: string) {
  return useQuery({
    queryKey: ["spaces-for-connections", floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      // Fetch rooms and hallways from the floor
      const [roomsResult, hallwaysResult] = await Promise.all([
        supabase
          .from("rooms")
          .select(`
            id,
            name,
            room_number,
            status
          `)
          .eq("floor_id", floorId)
          .neq("status", "inactive"),
        supabase
          .from("hallways")
          .select(`
            id,
            name,
            status
          `)
          .eq("floor_id", floorId)
          .neq("status", "inactive")
      ]);
      
      if (roomsResult.error) throw roomsResult.error;
      if (hallwaysResult.error) throw hallwaysResult.error;
      
      // Format spaces for dropdown
      const formattedSpaces: SpaceOption[] = [
        ...(roomsResult.data || []).map(room => ({
          id: room.id,
          name: room.name,
          type: 'room' as const,
          room_number: room.room_number
        })),
        ...(hallwaysResult.data || []).map(hallway => ({
          id: hallway.id,
          name: hallway.name,
          type: 'hallway' as const,
          room_number: null
        }))
      ];
      
      return formattedSpaces;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!floorId,
    retry: 3
  });
}
