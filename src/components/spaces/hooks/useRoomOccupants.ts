
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

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
          occupant_id,
          occupants!fk_occupant_room_assignments_occupant (
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
        logger.error('Error fetching room occupants:', error);
        throw error;
      }

      return data?.map(assignment => ({
        id: assignment.id,
        assignmentType: assignment.assignment_type,
        isPrimary: assignment.is_primary,
        schedule: assignment.schedule,
        occupant: assignment.occupants ? {
          id: (assignment.occupants as Record<string, unknown>)?.id,
          firstName: (assignment.occupants as Record<string, unknown>)?.first_name,
          lastName: (assignment.occupants as Record<string, unknown>)?.last_name,
          title: (assignment.occupants as Record<string, unknown>)?.title,
          email: (assignment.occupants as Record<string, unknown>)?.email,
          phone: (assignment.occupants as Record<string, unknown>)?.phone,
          status: (assignment.occupants as Record<string, unknown>)?.status
        } : null
      })).filter(assignment => assignment.occupant !== null) || [];
    },
    enabled: !!roomId,
  });
}
