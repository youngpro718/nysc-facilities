import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  };
}

export const useUserRoomAssignments = (userId?: string) => {
  return useQuery<UserRoomAssignment[]>({
    queryKey: ['userRoomAssignments', userId],
    queryFn: async () => {
      if (!userId) return [];

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
        .eq('occupant_id', userId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};