
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FloorPlanNode, FloorPlanEdge } from "../types/floorPlanTypes";
import { transformSpaceToNode } from "../utils/nodeTransforms";

export function useFloorPlanData(floorId: string | null) {
  // Fetch spaces (objects) for the floor
  const objectsQuery = useQuery({
    queryKey: ["floor-plan-objects", floorId],
    queryFn: async () => {
      if (!floorId) return [];

      // Fetch all spaces for this floor
      const { data: spaces, error } = await supabase
        .from("new_spaces")
        .select(`
          id,
          name,
          type,
          floor_id,
          room_number,
          status,
          position,
          size,
          rotation,
          properties,
          hallway_properties (*)
        `)
        .eq("floor_id", floorId);

      if (error) {
        console.error("Error fetching spaces:", error);
        throw error;
      }

      // Transform spaces to nodes
      return spaces.map((space, index) => transformSpaceToNode(space, index));
    },
    enabled: !!floorId
  });

  // Fetch connections (edges) for the floor
  const edgesQuery = useQuery({
    queryKey: ["floor-plan-connections", floorId],
    queryFn: async () => {
      if (!floorId) return [];

      // Fetch connections between spaces on this floor
      const { data: connections, error } = await supabase
        .from("space_connections")
        .select(`
          id,
          from_space_id,
          to_space_id,
          connection_type,
          status,
          direction,
          space_type,
          hallway_position,
          offset_distance
        `)
        .eq("floor_id", floorId);

      if (error) {
        console.error("Error fetching connections:", error);
        throw error;
      }

      // Transform connections to edges
      return connections.map((connection): FloorPlanEdge => ({
        id: connection.id,
        source: connection.from_space_id,
        target: connection.to_space_id,
        type: "default",
        data: {
          type: connection.connection_type,
          direction: connection.direction,
          hallwayPosition: connection.hallway_position,
          offsetDistance: connection.offset_distance,
          style: {
            stroke: connection.status === 'active' ? '#94a3b8' : '#cbd5e1',
            strokeWidth: 2,
            strokeDasharray: connection.status === 'active' ? undefined : '5,5'
          }
        }
      }));
    },
    enabled: !!floorId
  });

  return {
    objects: objectsQuery.data || [],
    edges: edgesQuery.data || [],
    isLoading: objectsQuery.isLoading || edgesQuery.isLoading,
    error: objectsQuery.error || edgesQuery.error
  };
}
