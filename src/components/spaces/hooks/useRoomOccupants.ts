
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRoomOccupants(roomId?: string) {
  return useQuery({
    queryKey: ['room-occupants', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('occupant_room_assignments')
        .select(`
          id,
          assignment_type,
          is_primary,
          schedule,
          occupants!inner (
            id,
            first_name,
            last_name,
            title,
            email,
            phone,
            status
          )
        `)
        .eq('room_id', roomId);

      if (error) {
        console.error('Error fetching room occupants:', error);
        throw error;
      }

      return data?.map(assignment => ({
        id: assignment.id,
        assignmentType: assignment.assignment_type,
        isPrimary: assignment.is_primary,
        schedule: assignment.schedule,
        occupant: {
          id: assignment.occupants.id,
          firstName: assignment.occupants.first_name,
          lastName: assignment.occupants.last_name,
          title: assignment.occupants.title,
          email: assignment.occupants.email,
          phone: assignment.occupants.phone,
          status: assignment.occupants.status
        }
      })) || [];
    },
    enabled: !!roomId,
  });
}
