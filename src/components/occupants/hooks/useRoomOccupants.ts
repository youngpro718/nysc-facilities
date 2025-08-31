
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
        console.error('Error fetching room occupants:', error);
        throw error;
      }
      
      if (!occupantsData) {
        console.log('No occupants data found');
        return [];
      }

      const mappedOccupants = occupantsData
        .filter(assignment => assignment.occupants)
        .map(assignment => ({
          id: assignment.occupants.id,
          first_name: assignment.occupants.first_name,
          last_name: assignment.occupants.last_name,
          is_primary: assignment.is_primary
        }));

      console.log('Current occupants:', mappedOccupants);
      return mappedOccupants;
    }
  });
}

