
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoomOccupant {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  room: {
    name: string;
    room_number?: string;
    floor: {
      name: string;
      building: {
        name: string;
      };
    };
  };
}

export function useRoomOccupants(roomId?: string) {
  return useQuery({
    queryKey: ['room-occupants', roomId],
    queryFn: async (): Promise<RoomOccupant[]> => {
      if (!roomId) return [];

      const { data: assignments, error } = await supabase
        .from('occupant_room_assignments')
        .select(`
          occupants!inner (
            id,
            first_name,
            last_name,
            title
          ),
          rooms!inner (
            name,
            room_number,
            floors!inner (
              name,
              buildings!inner (
                name
              )
            )
          )
        `)
        .eq('room_id', roomId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching room occupants:', error);
        throw error;
      }

      if (!assignments) return [];

      // Transform the data to match our interface
      return assignments.map((assignment: any) => ({
        id: assignment.occupants?.id || '',
        first_name: assignment.occupants?.first_name || '',
        last_name: assignment.occupants?.last_name || '',
        title: assignment.occupants?.title || '',
        room: {
          name: assignment.rooms?.name || '',
          room_number: assignment.rooms?.room_number || '',
          floor: {
            name: assignment.rooms?.floors?.name || '',
            building: {
              name: assignment.rooms?.floors?.buildings?.name || ''
            }
          }
        }
      }));
    },
    enabled: !!roomId,
  });
}
