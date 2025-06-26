
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserAssignment } from "@/types/dashboard";

export const useRoomAssignments = (userId?: string) => {
  const { data: assignedRooms = [] } = useQuery<UserAssignment[]>({
    queryKey: ['assignedRooms', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID available');
      
      console.log('Fetching room assignments for user:', userId);
      
      // First get the room assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('occupant_room_assignments')
        .select(`
          id,
          assigned_at,
          is_primary,
          assignment_type,
          room_id
        `)
        .eq('occupant_id', userId);

      if (assignmentsError) {
        console.error('Error fetching room assignments:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        return [];
      }

      // Get room details for each assignment
      const roomIds = assignments.map(a => a.room_id);
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
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
        `)
        .in('id', roomIds);

      if (roomsError) {
        console.error('Error fetching room details:', roomsError);
        throw roomsError;
      }

      // Combine the data
      const formattedAssignments = assignments.map(assignment => {
        const room = rooms?.find(r => r.id === assignment.room_id);
        
        return {
          id: assignment.id,
          room_id: assignment.room_id,
          room_name: room?.name || 'Unknown Room',
          room_number: room?.room_number || 'N/A',
          floor_id: room?.floor_id,
          building_id: room?.floors?.building_id,
          building_name: room?.floors?.buildings?.name || 'Unknown Building',
          floor_name: room?.floors?.name || 'Unknown Floor',
          assigned_at: assignment.assigned_at,
          is_primary: assignment.is_primary,
          assignment_type: assignment.assignment_type,
          room_status: room?.status
        };
      }).filter(assignment => assignment.room_name !== 'Unknown Room');
      
      console.log('Formatted room assignments:', formattedAssignments);
      
      return formattedAssignments;
    },
    enabled: !!userId,
    staleTime: 60000, // Cache for 1 minute
  });

  return { assignedRooms };
};
