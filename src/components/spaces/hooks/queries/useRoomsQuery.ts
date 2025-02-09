
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Room, StorageType, RoomType } from "../../rooms/types/RoomTypes";
import { useToast } from "@/hooks/use-toast";

export function useRoomsQuery() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      console.log("Fetching rooms with connections, history, and lighting...");
      
      // First fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          floors:floor_id (
            name,
            buildings:building_id (
              id,
              name
            )
          ),
          parent_room:parent_room_id (
            name
          ),
          issues (
            id,
            title,
            status,
            type,
            priority,
            created_at
          ),
          room_history (
            change_type,
            previous_values,
            new_values,
            created_at
          ),
          lighting_fixture:lighting_fixture_details!space_id (
            id,
            type,
            status,
            technology,
            electrical_issues,
            ballast_issue,
            maintenance_notes,
            position,
            sequence_number
          )
        `);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        toast({
          title: "Error",
          description: "Failed to fetch rooms. Please try again.",
          variant: "destructive",
        });
        throw roomsError;
      }

      if (!roomsData) return [];

      // Transform the room data to match the Room type
      const transformedRooms: Room[] = roomsData.map(room => {
        // Get the first fixture if there are multiple
        const lightingFixture = Array.isArray(room.lighting_fixture) 
          ? room.lighting_fixture[0] 
          : room.lighting_fixture;

        return {
          ...room,
          lighting_fixture: lightingFixture ? {
            id: lightingFixture.id,
            type: lightingFixture.type,
            status: lightingFixture.status,
            technology: lightingFixture.technology,
            electrical_issues: typeof lightingFixture.electrical_issues === 'string' 
              ? JSON.parse(lightingFixture.electrical_issues)
              : lightingFixture.electrical_issues || {
                  short_circuit: false,
                  wiring_issues: false,
                  voltage_problems: false
                },
            ballast_issue: lightingFixture.ballast_issue,
            maintenance_notes: lightingFixture.maintenance_notes
          } : null,
          id: room.id,
          name: room.name,
          room_number: room.room_number,
          room_type: room.room_type as RoomType,
          description: room.description || undefined,
          status: room.status as "active" | "inactive" | "under_maintenance",
          floor_id: room.floor_id,
          parent_room_id: room.parent_room_id || undefined,
          is_storage: room.is_storage,
          storage_capacity: room.storage_capacity || null,
          storage_type: room.storage_type ? (room.storage_type as StorageType) : null,
          storage_notes: room.storage_notes || undefined,
          phone_number: room.phone_number || undefined,
          created_at: room.created_at,
          current_function: room.current_function || undefined,
          previous_functions: room.previous_functions || undefined,
          function_change_date: room.function_change_date || undefined,
          floors: room.floors ? {
            name: room.floors.name,
            buildings: room.floors.buildings ? {
              id: room.floors.buildings.id,
              name: room.floors.buildings.name
            } : undefined
          } : undefined,
          parent_room: room.parent_room ? {
            name: room.parent_room.name
          } : undefined,
          space_connections: [],
          issues: room.issues || [],
          room_history: room.room_history || []
        };
      });

      console.log("Transformed room data:", transformedRooms);
      return transformedRooms;
    },
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    retry: 2
  });
}
