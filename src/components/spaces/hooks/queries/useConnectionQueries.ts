
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SpaceConnection, Connection, Direction, Position, ConnectionStatus } from "../../connections/types/ConnectionTypes";

interface ConnectedSpace {
  id: string;
  name: string;
  type?: string;
  room_number?: string;
  room_type?: string;
}

interface SpaceConnectionData {
  id: string;
  from_space_id: string;
  to_space_id: string;
  space_type: string;
  connection_type: string;
  direction?: Direction;
  position?: Position;
  status: ConnectionStatus;
  hallway_position?: number;
  offset_distance?: number;
  rooms?: ConnectedSpace;
  hallways?: ConnectedSpace;
  doors?: ConnectedSpace;
}

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
        hallway_position,
        offset_distance`;

      // Add the appropriate join based on space type
      if (spaceType === "room") {
        selectStatement += `,
          rooms!space_connections_to_space_id_fkey (
            id,
            name,
            room_number,
            room_type
          )`;
      } else if (spaceType === "hallway") {
        selectStatement += `,
          hallways!space_connections_to_space_id_fkey (
            id,
            name,
            type
          )`;
      } else if (spaceType === "door") {
        selectStatement += `,
          doors!space_connections_to_space_id_fkey (
            id,
            name,
            type
          )`;
      }

      const { data, error } = await supabase
        .from("space_connections")
        .select(selectStatement)
        .or(`from_space_id.eq.${spaceId},to_space_id.eq.${spaceId}`)
        .eq("status", "active")
        .returns<SpaceConnectionData[]>();

      if (error) {
        console.error("Error fetching space connections:", error);
        throw error;
      }

      console.log("Space connections found:", data);

      if (!data) return [];

      return data.map((conn): SpaceConnection => {
        const toSpace = conn.rooms || conn.hallways || conn.doors;
        
        return {
          id: conn.id,
          to_space: toSpace ? {
            name: toSpace.name,
            id: toSpace.id,
            type: toSpace.type || spaceType
          } : undefined,
          direction: conn.direction,
          connection_type: conn.connection_type,
          status: conn.status,
          position: conn.position,
          hallway_position: conn.hallway_position,
          offset_distance: conn.offset_distance
        };
      });
    },
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchOnWindowFocus: true,
  });
}
