
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Connection, Direction, Position, ConnectionStatus } from "../../connections/types/ConnectionTypes";
import { toast } from "sonner";

export function useConnectionQueries(spaceId: string, spaceType: "room" | "hallway" | "door") {
  return useQuery({
    queryKey: ["space-connections", spaceId, spaceType],
    queryFn: async () => {
      console.log("Fetching connections for space:", { spaceId, spaceType });
      
      // First validate that the source space exists and is active
      const { data: sourceSpace, error: sourceError } = await supabase
        .from("spaces")
        .select("id, type")
        .eq("id", spaceId)
        .eq("status", "active")
        .single();

      if (sourceError || !sourceSpace) {
        console.error("Source space not found or not active:", sourceError);
        return [];
      }

      // Then get the connections with their related spaces
      const { data: connections, error } = await supabase
        .from("space_connections")
        .select(`
          id,
          from_space_id,
          to_space_id,
          space_type,
          connection_type,
          direction,
          position,
          status,
          hallway_position,
          offset_distance,
          to_space:spaces!to_space_id (
            name,
            room_number,
            type
          )
        `)
        .or(`from_space_id.eq.${spaceId},to_space_id.eq.${spaceId}`)
        .eq("status", "active");

      if (error) {
        console.error("Error fetching space connections:", error);
        toast.error("Failed to load connections");
        throw error;
      }

      if (!connections) return [];

      // Transform the connections data
      return connections.map((conn): Connection => {
        const connectedSpaceId = conn.from_space_id === spaceId ? conn.to_space_id : conn.from_space_id;
        const connectedSpace = conn.to_space;

        return {
          id: conn.id,
          from_space_id: conn.from_space_id,
          to_space_id: conn.to_space_id,
          space_type: conn.space_type,
          connection_type: conn.connection_type,
          direction: conn.direction as Direction,
          position: conn.position as Position,
          status: conn.status as ConnectionStatus,
          hallway_position: conn.hallway_position,
          offset_distance: conn.offset_distance,
          to_space: connectedSpace,
          connectionType: conn.connection_type
        };
      });
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });
}
