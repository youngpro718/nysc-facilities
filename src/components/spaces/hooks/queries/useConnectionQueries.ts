
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
      
      // First get the connections
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
          offset_distance
        `)
        .or(`from_space_id.eq.${spaceId},to_space_id.eq.${spaceId}`)
        .eq("status", "active")
        .returns<SpaceConnectionData[]>();

      if (error) {
        console.error("Error fetching space connections:", error);
        throw error;
      }

      if (!connections) return [];

      // Then get the connected spaces info
      const spaceIds = connections.map(conn => 
        conn.from_space_id === spaceId ? conn.to_space_id : conn.from_space_id
      );

      const { data: spacesData, error: spacesError } = await supabase
        .from("spaces")
        .select("id, name, type, room_number")
        .in("id", spaceIds);

      if (spacesError) {
        console.error("Error fetching connected spaces:", spacesError);
        throw spacesError;
      }

      // Map the spaces data to our connections
      return connections.map((conn): SpaceConnection => {
        const connectedSpaceId = conn.from_space_id === spaceId ? conn.to_space_id : conn.from_space_id;
        const connectedSpace = spacesData?.find(space => space.id === connectedSpaceId);
        
        return {
          id: conn.id,
          from_space_id: conn.from_space_id,
          to_space_id: conn.to_space_id,
          space_type: conn.space_type,
          connection_type: conn.connection_type,
          direction: conn.direction,
          position: conn.position,
          status: conn.status,
          metadata: {},
          hallway_position: conn.hallway_position,
          offset_distance: conn.offset_distance,
          to_space: connectedSpace ? {
            name: connectedSpace.name,
            room_number: connectedSpace.room_number,
            type: connectedSpace.type
          } : undefined
        };
      });
    },
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchOnWindowFocus: true,
  });
}
