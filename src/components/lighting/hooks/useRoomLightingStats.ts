import { useQuery } from "@tanstack/react-query";
import { fetchRoomLightingStats } from "@/lib/supabase";
import { RoomLightingStats } from "@/types/lighting";

export function useRoomLightingStats() {
  return useQuery({
    queryKey: ["room-lighting-stats"],
    queryFn: fetchRoomLightingStats as any,
    staleTime: 60_000,
  });
}
