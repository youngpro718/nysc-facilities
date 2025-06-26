
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserAssignment } from "@/types/dashboard";

export const useRoomAssignments = (userId?: string) => {
  const { data: assignedRooms = [] } = useQuery<UserAssignment[]>({
    queryKey: ['assignedRooms', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID available');
      
      console.log('Fetching room assignments for user:', userId);
      
      try {
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

        // Get room details separately to avoid relationship issues
        const roomIds = assignments.map(a => a.room_id);
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select(`
            id,
            name,
            room_number,
            status,
            floor_id
          `)
          .in('id', roomIds);

        if (roomsError) {
          console.error('Error fetching room details:', roomsError);
          throw roomsError;
        }

        // Get floor and building information separately
        const floorIds = rooms?.map(r => r.floor_id).filter(Boolean) || [];
        const { data: floors, error: floorsError } = await supabase
          .from('floors')
          .select(`
            id,
            name,
            building_id
          `)
          .in('id', floorIds);

        if (floorsError) {
          console.error('Error fetching floor details:', floorsError);
          throw floorsError;
        }

        // Get building information
        const buildingIds = floors?.map(f => f.building_id).filter(Boolean) || [];
        const { data: buildings, error: buildingsError } = await supabase
          .from('buildings')
          .select(`
            id,
            name
          `)
          .in('id', buildingIds);

        if (buildingsError) {
          console.error('Error fetching building details:', buildingsError);
          throw buildingsError;
        }

        // Combine the data
        const formattedAssignments = assignments.map(assignment => {
          const room = rooms?.find(r => r.id === assignment.room_id);
          const floor = floors?.find(f => f.id === room?.floor_id);
          const building = buildings?.find(b => b.id === floor?.building_id);
          
          return {
            id: assignment.id,
            room_id: assignment.room_id,
            room_name: room?.name || 'Unknown Room',
            room_number: room?.room_number || 'N/A',
            floor_id: room?.floor_id,
            building_id: floor?.building_id,
            building_name: building?.name || 'Unknown Building',
            floor_name: floor?.name || 'Unknown Floor',
            assigned_at: assignment.assigned_at,
            is_primary: assignment.is_primary,
            assignment_type: assignment.assignment_type,
            room_status: room?.status
          };
        }).filter(assignment => assignment.room_name !== 'Unknown Room');
        
        console.log('Formatted room assignments:', formattedAssignments);
        
        return formattedAssignments;
      } catch (error) {
        console.error('Error in room assignments query:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 60000, // Cache for 1 minute
  });

  return { assignedRooms };
};
