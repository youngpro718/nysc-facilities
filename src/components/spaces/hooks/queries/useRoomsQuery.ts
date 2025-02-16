
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Room, StorageType, RoomType } from "../../rooms/types/RoomTypes";
import { useToast } from "@/hooks/use-toast";

export function useRoomsQuery() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      console.log("Fetching rooms data...");
      
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          lighting_fixture:lighting_fixtures (
            id,
            type,
            status,
            technology,
            electrical_issues,
            ballast_issue,
            maintenance_notes,
            emergency_circuit,
            bulb_count,
            position,
            sequence_number,
            name
          ),
          floors (
            id,
            name,
            floor_number,
            buildings (
              id,
              name,
              address
            )
          ),
          parent_room:parent_room_id (
            id,
            name,
            room_number,
            room_type
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

      console.log("Raw room data:", roomsData);

      const transformedRooms: Room[] = roomsData.map(room => {
        const lightingFixture = Array.isArray(room.lighting_fixture) && room.lighting_fixture.length > 0
          ? room.lighting_fixture[0]  // Take the first fixture if it exists
          : null;

        return {
          id: room.id,
          name: room.name,
          room_number: room.room_number,
          room_type: room.room_type as RoomType,
          description: room.description || undefined,
          status: room.status,
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
          lighting_fixture: lightingFixture ? {
            id: lightingFixture.id,
            type: lightingFixture.type,
            status: lightingFixture.status,
            technology: lightingFixture.technology,
            electrical_issues: lightingFixture.electrical_issues,
            ballast_issue: lightingFixture.ballast_issue,
            maintenance_notes: lightingFixture.maintenance_notes,
            emergency_circuit: lightingFixture.emergency_circuit,
            bulb_count: lightingFixture.bulb_count,
            position: lightingFixture.position,
            sequence_number: lightingFixture.sequence_number,
            name: lightingFixture.name
          } : null,
          floors: room.floors ? {
            id: room.floors.id,
            name: room.floors.name,
            floor_number: room.floors.floor_number,
            buildings: room.floors.buildings ? {
              id: room.floors.buildings.id,
              name: room.floors.buildings.name,
              address: room.floors.buildings.address
            } : undefined
          } : undefined,
          parent_room: room.parent_room ? {
            id: room.parent_room.id,
            name: room.parent_room.name,
            room_number: room.parent_room.room_number,
            room_type: room.parent_room.room_type
          } : undefined,
        };
      });

      console.log("Transformed room data:", transformedRooms);
      return transformedRooms;
    }
  });
}
