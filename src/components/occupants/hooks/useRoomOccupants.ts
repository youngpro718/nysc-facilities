
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

interface Occupant {
  id: string;
  first_name: string;
  last_name: string;
  is_primary: boolean;
}

export function useRoomOccupants(selectedRoom: string, authError: boolean | null) {
  return useQuery({
    queryKey: ["room-occupants", selectedRoom],
    enabled: !!selectedRoom && !authError,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const { data: occupantsData, error } = await supabase
        .from("occupant_room_assignments")
        .select(`
          is_primary,
          occupants!fk_occupant_room_assignments_occupant (
            id,
            first_name,
            last_name
          )
        `)
        .eq("room_id", selectedRoom);

      if (error) {
        logger.error('Error fetching room occupants:', error);
        throw error;
      }
      
      if (!occupantsData) {
        logger.debug('No occupants data found');
        return [];
      }

      const mappedOccupants = occupantsData
        .filter(assignment => assignment.occupants)
        .map(assignment => ({
          id: (assignment.occupants as Record<string, unknown>)?.id,
          first_name: (assignment.occupants as Record<string, unknown>)?.first_name,
          last_name: (assignment.occupants as Record<string, unknown>)?.last_name,
          is_primary: assignment.is_primary
        }));

      logger.debug('Current occupants:', mappedOccupants);
      return mappedOccupants;
    }
  });
}

