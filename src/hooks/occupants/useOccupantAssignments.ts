import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DetailedRoomAssignment {
  id: string;
  room_id: string;
  room_name: string;
  room_number: string;
  building_id: string;
  building_name: string;
  floor_id: string;
  floor_name: string;
  assignment_type: string;
  is_primary: boolean;
  assigned_at: string;
  schedule?: string;
  notes?: string;
  is_storage?: boolean;
  storage_type?: string;
  storage_capacity?: number;
}

export interface DetailedKeyAssignment {
  id: string;
  key_id: string;
  key_name: string;
  key_type: string;
  assigned_at: string;
  is_spare: boolean;
  room_id?: string;
  room_name?: string;
  room_number?: string;
  building_name?: string;
}

export interface OccupantAssignments {
  roomAssignments: DetailedRoomAssignment[];
  keyAssignments: DetailedKeyAssignment[];
  primaryRoom?: DetailedRoomAssignment;
  storageAssignments: DetailedRoomAssignment[];
}

export const useOccupantAssignments = (occupantId: string) => {
  return useQuery<OccupantAssignments>({
    queryKey: ['occupantAssignments', occupantId],
    queryFn: async () => {
      if (!occupantId) throw new Error('No occupant ID provided');

      try {
        // Fetch room assignments with full details
        const { data: roomAssignments, error: roomError } = await supabase
          .from('occupant_room_assignments')
          .select(`
            id,
            room_id,
            assignment_type,
            is_primary,
            assigned_at,
            schedule,
            notes,
            rooms!occupant_room_assignments_room_id_fkey (
              id,
              name,
              room_number,
              floor_id,
              is_storage,
              storage_type,
              storage_capacity,
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
          .eq('occupant_id', occupantId);

        if (roomError) {
          console.error('Error fetching room assignments:', roomError);
          throw roomError;
        }

        // Fetch key assignments with room details
        const { data: keyAssignments, error: keyError } = await supabase
          .from('key_assignments')
          .select(`
            id,
            key_id,
            assigned_at,
            is_spare,
            keys!key_assignments_key_id_fkey (
              id,
              name,
              type
            )
          `)
          .eq('occupant_id', occupantId)
          .is('returned_at', null);

        if (keyError) {
          console.error('Error fetching key assignments:', keyError);
          throw keyError;
        }

        // Format room assignments
        const formattedRoomAssignments: DetailedRoomAssignment[] = (roomAssignments || []).map((assignment: any) => ({
          id: assignment.id,
          room_id: assignment.room_id,
          room_name: assignment.rooms?.name || 'Unknown Room',
          room_number: assignment.rooms?.room_number || 'N/A',
          building_id: assignment.rooms?.floors?.building_id || '',
          building_name: assignment.rooms?.floors?.buildings?.name || 'Unknown Building',
          floor_id: assignment.rooms?.floor_id || '',
          floor_name: assignment.rooms?.floors?.name || 'Unknown Floor',
          assignment_type: assignment.assignment_type || 'standard',
          is_primary: assignment.is_primary || false,
          assigned_at: assignment.assigned_at,
          schedule: typeof assignment.schedule === 'string' ? assignment.schedule : '',
          notes: assignment.notes || '',
          is_storage: assignment.rooms?.is_storage || false,
          storage_type: assignment.rooms?.storage_type || undefined,
          storage_capacity: assignment.rooms?.storage_capacity || undefined
        }));

        // Format key assignments
        const formattedKeyAssignments: DetailedKeyAssignment[] = (keyAssignments || []).map((assignment: any) => ({
          id: assignment.id,
          key_id: assignment.key_id,
          key_name: assignment.keys?.name || 'Unknown Key',
          key_type: assignment.keys?.type || 'standard',
          assigned_at: assignment.assigned_at,
          is_spare: assignment.is_spare || false,
          room_id: undefined,
          room_name: undefined,
          room_number: undefined,
          building_name: undefined
        }));

        // Find primary room
        const primaryRoom = formattedRoomAssignments.find(room => room.is_primary);
        
        // Separate storage room assignments
        const storageAssignments = formattedRoomAssignments.filter(room => room.is_storage);

        return {
          roomAssignments: formattedRoomAssignments,
          keyAssignments: formattedKeyAssignments,
          primaryRoom,
          storageAssignments
        };
      } catch (error) {
        console.error('Error in useOccupantAssignments:', error);
        throw error;
      }
    },
    enabled: !!occupantId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};