
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserAssignment } from "@/types/dashboard";

export const useRoomAssignments = (userId?: string) => {
  const { data: assignedRooms = [] } = useQuery<UserAssignment[]>({
    queryKey: ['assignedRooms', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID available');
      
      console.log('Fetching room assignments for user:', userId);
      
      const { data, error } = await supabase
        .from('occupant_room_assignments')
        .select(`
          id,
          assigned_at,
          is_primary,
          assignment_type,
          room_id,
          rooms!occupant_room_assignments_room_id_fkey (
            id,
            name,
            room_number,
            status,
            floor_id,
            floors!rooms_floor_id_fkey (
              id,
              name,
              building_id,
              buildings!floors_building_id_fkey (
                id,
                name
              )
            )
          )
        `)
        .eq('occupant_id', userId);

      if (error) {
        console.error('Error fetching room assignments:', error);
        throw error;
      }
      
      console.log('Raw room assignment data:', data);
      
      const formattedAssignments = data.map(assignment => ({
        id: assignment.id,
        room_id: assignment.room_id,
        room_name: assignment.rooms?.name || 'Unknown Room',
        room_number: assignment.rooms?.room_number || 'N/A',
        floor_id: assignment.rooms?.floor_id,
        building_id: assignment.rooms?.floors?.building_id,
        building_name: assignment.rooms?.floors?.buildings?.name || 'Unknown Building',
        floor_name: assignment.rooms?.floors?.name || 'Unknown Floor',
        assigned_at: assignment.assigned_at,
        is_primary: assignment.is_primary,
        assignment_type: assignment.assignment_type,
        room_status: assignment.rooms?.status
      }));
      
      console.log('Formatted room assignments:', formattedAssignments);
      
      return formattedAssignments;
    },
    enabled: !!userId,
    staleTime: 60000, // Cache for 1 minute
  });

  return { assignedRooms };
};
