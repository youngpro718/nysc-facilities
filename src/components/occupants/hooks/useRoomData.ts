
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { RoomDetails } from "../types/assignmentTypes";

export function useRoomData(authError: boolean | null) {
  return useQuery({
    queryKey: ["available-rooms"],
    enabled: !authError,
    queryFn: async () => {
      console.log("Fetching rooms data...");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }
      
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          room_number,
          capacity,
          current_occupancy,
          floors!rooms_floor_id_fkey (
            name,
            buildings!floors_building_id_fkey (
              name
            )
          )
        `)
        .eq("status", "active")
        .order("name");

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw roomsError;
      }

      console.log('Available rooms fetched:', roomsData);
      return roomsData as RoomDetails[];
    },
  });
}
