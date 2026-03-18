import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface UserRoomAssignment {
  id: string;
  room_id: string;
  assignment_type: string;
  is_primary: boolean;
  rooms: {
    id: string;
    name: string;
    room_number: string;
    floor_id: string;
  } | null;
}

export const useUserRoomAssignments = (userId?: string) => {
  return useQuery<UserRoomAssignment[]>({
    queryKey: ['userRoomAssignments', userId],
    queryFn: async () => {
      if (!userId) return [];

      const identityFilter = `profile_id.eq.${userId},occupant_id.eq.${userId},personnel_profile_id.eq.${userId}`;

      const { data, error } = await supabase
        .from('occupant_room_assignments')
        .select(`
          id,
          room_id,
          assignment_type,
          is_primary,
          rooms!occupant_room_assignments_room_id_fkey (
            id,
            name,
            room_number,
            floor_id
          )
        `)
        .or(identityFilter)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(assignment => ({
        ...assignment,
        rooms: Array.isArray(assignment.rooms) ? assignment.rooms[0] || null : assignment.rooms
      }));
    },
    enabled: !!userId,
  });
};