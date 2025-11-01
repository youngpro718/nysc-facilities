
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useAvailableSpaces(
  spaceId: string,
  spaceType: "room" | "hallway" | "door",
  connectionType: "room" | "hallway" | "door"
) {
  return useQuery({
    queryKey: ["available-spaces", spaceId, spaceType, connectionType],
    queryFn: async () => {
      console.log("Fetching available spaces:", { spaceId, spaceType, connectionType });

      // Get floor_id from the appropriate table based on space type
      const { data: currentSpace, error: spaceError } = await supabase
        .from(spaceType === "room" ? "rooms" : 
              spaceType === "hallway" ? "hallways" : "doors")
        .select("floor_id")
        .eq("id", spaceId)
        .single();

      if (spaceError) {
        console.error("Error finding current space:", spaceError);
        throw spaceError;
      }

      if (!currentSpace) {
        console.error("Could not find current space");
        return [];
      }

      if (connectionType === "room") {
        const { data, error } = await supabase
          .from("rooms")
          .select(`
            id,
            name,
            room_number,
            room_type,
            floor_id
          `)
          .neq("id", spaceId)
          .eq("floor_id", currentSpace.floor_id)
          .eq("status", "active")
          .order("name");
        
        if (error) {
          console.error("Error fetching rooms:", error);
          throw error;
        }

        console.log("Available rooms:", data);
        return data.map(room => ({
          id: room.id,
          name: room.name,
          room_number: room.room_number,
          type: room.room_type,
          floor_id: room.floor_id
        }));
      } 
      
      if (connectionType === "hallway") {
        const { data, error } = await supabase
          .from("hallways")
          .select(`
            id,
            name,
            type,
            floor_id,
            section
          `)
          .eq("floor_id", currentSpace.floor_id)
          .eq("status", "active")
          .order("name");
        
        if (error) {
          console.error("Error fetching hallways:", error);
          throw error;
        }

        console.log("Available hallways:", data);
        return data.map(hallway => ({
          id: hallway.id,
          name: hallway.name,
          type: hallway.type,
          section: hallway.section,
          floor_id: hallway.floor_id
        }));
      } 
      
      if (connectionType === "door") {
        const { data, error } = await supabase
          .from("doors")
          .select(`
            id,
            name,
            type,
            floor_id,
            security_level
          `)
          .eq("floor_id", currentSpace.floor_id)
          .eq("status", "active")
          .order("name");
        
        if (error) {
          console.error("Error fetching doors:", error);
          throw error;
        }

        console.log("Available doors:", data);
        return data.map(door => ({
          id: door.id,
          name: door.name,
          type: door.type,
          security_level: door.security_level,
          floor_id: door.floor_id
        }));
      }

      return [];
    },
  });
}
