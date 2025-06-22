
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RoomOccupant {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
  assignment_type: string;
  is_primary: boolean;
  schedule?: any;
  room_id?: string;
  room_name?: string;
  room_number?: string;
  floor_name?: string;
  building_name?: string;
}

export function useRoomOccupants(roomId: string | undefined) {
  return useQuery({
    queryKey: ["room-occupants", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from("occupant_room_assignments")
        .select(`
          assignment_type,
          is_primary,
          schedule,
          room_id,
          rooms!room_id (
            id,
            name,
            room_number,
            floors (
              name,
              buildings (
                name
              )
            )
          ),
          occupants!occupant_id (
            id,
            first_name,
            last_name,
            title
          )
        `)
        .eq("room_id", roomId);

      if (error) throw error;

      return (data || [])
        .filter(assignment => assignment.occupants && assignment.rooms)
        .map(assignment => ({
          id: assignment.occupants!.id,
          first_name: assignment.occupants!.first_name,
          last_name: assignment.occupants!.last_name,
          title: assignment.occupants!.title,
          assignment_type: assignment.assignment_type,
          is_primary: assignment.is_primary,
          schedule: assignment.schedule,
          room_id: assignment.room_id,
          room_name: assignment.rooms!.name,
          room_number: assignment.rooms!.room_number,
          floor_name: assignment.rooms!.floors?.name,
          building_name: assignment.rooms!.floors?.buildings?.name,
        })) as RoomOccupant[];
    },
  });
}
