
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SpaceConnection, Connection, Direction, Position } from "../../connections/types/ConnectionTypes";
import { PostgrestResponse } from "@supabase/supabase-js";

export function useConnectionQueries(spaceId: string, spaceType: "room" | "hallway" | "door") {
  return useQuery({
    queryKey: ["space-connections", spaceId, spaceType],
    queryFn: async () => {
      console.log("Fetching connections for space:", { spaceId, spaceType });
      
      // Base fields to select for any connection type
      let selectStatement = `
        id,
        from_space_id,
        to_space_id,
        space_type,
        connection_type,
        direction,
        position,
        status,
        metadata`;

      // Add the appropriate join based on space type
      if (spaceType === "room") {
        selectStatement += `,
          to_space:rooms!space_connections_to_space_id_fkey (
            id,
            name,
            room_number,
            room_type
          )`;
      } else if (spaceType === "hallway") {
        selectStatement += `,
          to_space:hallways!space_connections_to_space_id_fkey (
            id,
            name,
            type
          )`;
      }

      const { data, error } = await supabase
        .from("space_connections")
        .select(selectStatement)
        .or(`from_space_id.eq.${spaceId},to_space_id.eq.${spaceId}`)
        .eq("space_type", spaceType)
        .eq("connection_status", "active")
        .returns<SpaceConnection[]>();

      if (error) {
        console.error("Error fetching space connections:", error);
        throw error;
      }

      console.log("Space connections found:", data);

      if (!data) return [];

      return data.map((conn): Connection => {
        const isFromSpace = conn.from_space_id === spaceId;
        return {
          id: conn.id,
          connectedSpaceName: conn.to_space?.name || "Unknown Space",
          connectionType: conn.connection_type,
          status: conn.status,
          direction: conn.direction as Direction,
          position: conn.position as Position
        };
      });
    },
  });
}
