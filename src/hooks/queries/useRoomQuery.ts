import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseRoomQueryOptions {
  enabled?: boolean;
}

export function useRoomQuery(roomId: string, options: UseRoomQueryOptions = {}) {
  return useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      if (!roomId) throw new Error("Room ID is required");

      // First, fetch the room details without related data
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select(`
          id, name, room_number, room_type, description, status, floor_id,
          is_storage, storage_type, storage_capacity, storage_notes,
          parent_room_id, current_function, phone_number
        `)
        .eq("id", roomId)
        .single();
        
      if (roomError) throw roomError;

      // Get floor and building data
      const { data: floorData } = await supabase
        .from("floors")
        .select(`
          id, name, 
          building:buildings!inner(id, name)
        `)
        .eq("id", roomData.floor_id)
        .single();

      // Get current occupants
      const { data: occupantsData } = await supabase
        .from("occupants")
        .select(`
          id, employee_id, end_date, start_date,
          employee:profiles!employee_id(id, first_name, last_name, email)
        `)
        .eq("room_id", roomId)
        .is("end_date", null);
        
      // Get issues
      const { data: issuesData } = await supabase
        .from("issues")
        .select(`id, description, status, created_at`)
        .eq("room_id", roomId);
        
      // Get connections
      const { data: connectionsData } = await supabase
        .from("space_connections")
        .select(`id, connection_type, to_space_id, direction`)
        .or(`from_space_id.eq.${roomId},to_space_id.eq.${roomId}`);

      // Combine all the data
      const transformedRoom = {
        ...roomData,
        floor: floorData,
        current_occupants: occupantsData ? occupantsData.map(occ => ({
          id: occ.id,
          first_name: occ.employee?.first_name,
          last_name: occ.employee?.last_name,
          email: occ.employee?.email,
          is_primary: false, // Default value since the column may not exist
          assigned_at: occ.start_date
        })) : [],
        issues: issuesData || [],
        space_connections: connectionsData || []
      };

      return transformedRoom;
    },
    ...options,
  });
}
