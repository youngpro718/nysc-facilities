import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOccupantAssignments(occupantId: string | undefined) {
  return useQuery({
    queryKey: ["occupant-assignments", occupantId],
    queryFn: async () => {
      if (!occupantId) return { rooms: [], keys: [] };

      const [roomAssignments, keyAssignments] = await Promise.all([
        supabase
          .from("occupant_room_assignments")
          .select("room_id, rooms(name, floor_id, floors(name, buildings(name)))")
          .eq("occupant_id", occupantId),
        supabase
          .from("key_assignments")
          .select("key_id, keys(name, type)")
          .eq("occupant_id", occupantId)
          .is("returned_at", null),
      ]);

      return {
        rooms: roomAssignments.data?.map((ra) => ra.room_id) || [],
        keys: keyAssignments.data?.map((ka) => ka.key_id) || [],
        roomDetails: roomAssignments.data || [],
        keyDetails: keyAssignments.data || [],
      };
    },
    enabled: !!occupantId,
  });
}