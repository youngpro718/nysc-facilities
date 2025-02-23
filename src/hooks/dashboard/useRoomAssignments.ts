
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserAssignment } from "@/types/dashboard";

export const useRoomAssignments = (userId?: string) => {
  const { data: assignedRooms = [] } = useQuery<UserAssignment[]>({
    queryKey: ['assignedRooms', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID available');
      const { data, error } = await supabase
        .from('occupant_room_assignments')
        .select(`
          id,
          assigned_at,
          is_primary,
          room_id,
          rooms (
            id,
            name,
            room_number,
            floor_id,
            floors (
              id,
              name,
              building_id,
              buildings (
                id,
                name
              )
            )
          )
        `)
        .eq('occupant_id', userId);

      if (error) throw error;
      
      return data.map(assignment => ({
        id: assignment.id,
        room_id: assignment.room_id,
        room_name: assignment.rooms?.name,
        room_number: assignment.rooms?.room_number,
        floor_id: assignment.rooms?.floor_id,
        building_id: assignment.rooms?.floors?.building_id,
        building_name: assignment.rooms?.floors?.buildings?.name,
        floor_name: assignment.rooms?.floors?.name,
        assigned_at: assignment.assigned_at,
        is_primary: assignment.is_primary
      }));
    },
    enabled: !!userId,
    staleTime: 60000, // Cache for 1 minute
  });

  return { assignedRooms };
};
