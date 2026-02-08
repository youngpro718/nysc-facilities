
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { UserAssignment } from "@/types/dashboard";

export const useRoomAssignments = (userId?: string) => {
  const { data: assignedRooms = [] } = useQuery<UserAssignment[]>({
    queryKey: ['assignedRooms', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID available');

      const identityFilter = `profile_id.eq.${userId},occupant_id.eq.${userId},personnel_profile_id.eq.${userId}`;
      
      logger.debug('Fetching room assignments for user:', userId);
      
      try {
        // Get room assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from('occupant_room_assignments')
          .select(`
            id,
            assigned_at,
            is_primary,
            assignment_type,
            room_id
          `)
          .or(identityFilter);

        if (assignmentsError) {
          logger.error('Error fetching room assignments:', assignmentsError);
          return [];
        }

        if (!assignments || assignments.length === 0) {
          logger.debug('No room assignments found for user');
          return [];
        }

        // Get room details
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
          logger.error('Error fetching room details:', roomsError);
          return [];
        }

        if (!rooms || rooms.length === 0) {
          logger.debug('No room details found');
          return [];
        }

        // Get floor and building information
        const floorIds = rooms.map(r => r.floor_id).filter(Boolean);
        const { data: floors, error: floorsError } = await supabase
          .from('floors')
          .select(`
            id,
            name,
            building_id
          `)
          .in('id', floorIds);

        if (floorsError) {
          logger.error('Error fetching floor details:', floorsError);
          return [];
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
          logger.error('Error fetching building details:', buildingsError);
          return [];
        }

        // Combine the data
        const formattedAssignments = assignments.map(assignment => {
          const room = rooms.find(r => r.id === assignment.room_id);
          if (!room) return null;
          
          const floor = floors?.find(f => f.id === room.floor_id);
          const building = buildings?.find(b => b.id === floor?.building_id);
          
          return {
            id: assignment.id,
            room_id: assignment.room_id,
            room_name: room.name || 'Unknown Room',
            room_number: room.room_number || 'N/A',
            floor_id: room.floor_id,
            building_id: floor?.building_id,
            building_name: building?.name || 'Unknown Building',
            floor_name: floor?.name || 'Unknown Floor',
            assigned_at: assignment.assigned_at,
            is_primary: assignment.is_primary,
            assignment_type: assignment.assignment_type,
            room_status: room.status
          };
        }).filter(assignment => assignment !== null);
        
        logger.debug('Formatted room assignments:', formattedAssignments);
        
        return formattedAssignments;
      } catch (error) {
        logger.error('Error in room assignments query:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 60000, // Cache for 1 minute
  });

  return { assignedRooms };
};
