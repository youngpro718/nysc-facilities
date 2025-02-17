
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RoomOccupant {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  assignment_type: string;
  is_primary: boolean;
  schedule?: any;
}

export function useRoomOccupants(roomId: string | undefined) {
  return useQuery({
    queryKey: ["room-occupants", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from("occupant_room_assignments")
        .select(`
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
        .eq("room_id", roomId);

      if (error) throw error;

      return (data || []).map(assignment => ({
        ...assignment.occupants,
        assignment_type: assignment.assignment_type,
        is_primary: assignment.is_primary,
        schedule: assignment.schedule,
      })) as RoomOccupant[];
    },
  });
}
