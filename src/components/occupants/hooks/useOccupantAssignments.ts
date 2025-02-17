
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOccupantAssignments(occupantId: string | undefined) {
  return useQuery({
    queryKey: ["occupant-assignments", occupantId],
    enabled: !!occupantId,
    queryFn: async () => {
      if (!occupantId) return { rooms: [], keys: [] };

      const [roomAssignments, keyAssignments] = await Promise.all([
        supabase
          .from("occupant_room_assignments")
          .select(`
            room_id,
            assignment_type,
            is_primary,
            schedule,
            rooms (
              id,
              name,
              floor_id,
              floors (
                name,
                buildings (
                  name
                )
              )
            )
          `)
          .eq("occupant_id", occupantId),
        supabase
          .from("key_assignments")
          .select(`
            key_id,
            keys (
              id,
              name,
              type
            )
          `)
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
  });
}
