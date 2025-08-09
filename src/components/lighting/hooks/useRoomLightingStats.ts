import { useQuery } from "@tanstack/react-query";
import { fetchRoomLightingStats } from "@/services/supabase/lightingService";
import { RoomLightingStats } from "@/types/lighting";

export function useRoomLightingStats() {
  return useQuery<RoomLightingStats[]>({
    queryKey: ["room-lighting-stats"],
    queryFn: fetchRoomLightingStats,
    staleTime: 60_000,
  });
}
