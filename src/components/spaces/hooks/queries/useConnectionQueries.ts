
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Connection, Direction, Position, ConnectionStatus, ConnectionType } from "../../connections/types/ConnectionTypes";
import { toast } from "sonner";

export function useConnectionQueries(spaceId: string, spaceType: "room" | "hallway" | "door") {
  return useQuery({
    queryKey: ["space-connections", spaceId, spaceType],
    queryFn: async () => {
      // Space connections functionality is disabled - no space_connections table exists
      console.log("Connections disabled for space:", { spaceId, spaceType });
      return [];
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });
}
