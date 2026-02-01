import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PersonSourceType } from "./useRoomAssignment";

export function useOccupantAssignments(
  personId: string | undefined,
  sourceType: PersonSourceType = 'profile'
) {
  return useQuery({
    queryKey: ["occupant-assignments", personId, sourceType],
    enabled: !!personId,
    queryFn: async () => {
      if (!personId) return { rooms: [], keys: [] };

      // Determine which column to query based on source type
      const idColumn = sourceType === 'profile' 
        ? 'profile_id' 
        : sourceType === 'personnel_profile' 
          ? 'personnel_profile_id' 
          : 'occupant_id';

      const [roomAssignments, keyAssignments] = await Promise.all([
        supabase
          .from("occupant_room_assignments")
          .select(`
            room_id,
            assignment_type,
            is_primary,
            schedule,
            rooms!occupant_room_assignments_room_id_fkey (
              id,
              name,
              room_number,
              floor_id,
              floors!rooms_floor_id_fkey (
                name,
                buildings!floors_building_id_fkey (
                  name
                )
              )
            )
          `)
          .eq(idColumn, personId),
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
          .eq(idColumn, personId)
          .is("returned_at", null),
      ]);

      if (roomAssignments.error) {
        console.error("Error fetching room assignments:", roomAssignments.error);
        throw roomAssignments.error;
      }

      if (keyAssignments.error) {
        console.error("Error fetching key assignments:", keyAssignments.error);
        throw keyAssignments.error;
      }

      return {
        rooms: roomAssignments.data?.map((ra) => ra.room_id) || [],
        keys: keyAssignments.data?.map((ka) => ka.key_id) || [],
        roomDetails: roomAssignments.data || [],
        keyDetails: keyAssignments.data || [],
      };
    },
  });
}
