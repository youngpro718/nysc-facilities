
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOccupantAssignments(roomIds: string[]) {
  return useQuery({
    queryKey: ["occupant-assignments", roomIds],
    enabled: roomIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupant_room_assignments")
        .select(`
          room_id,
          assignment_type,
          is_primary,
          schedule,
          occupants!fk_occupant_room_assignments_occupant (
            id,
            first_name,
            last_name,
            title
          )
        `)
        .in("room_id", roomIds);

      if (error) throw error;
      return data || [];
    }
  });
}
