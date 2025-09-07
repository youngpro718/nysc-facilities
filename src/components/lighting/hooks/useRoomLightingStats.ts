import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { RoomLightingStats } from "@/types/lighting";

const fetchRoomLightingStats = async () => {
  const { data, error } = await supabase
    .from('unified_spaces')
    .select(`
      id,
      name,
      room_number,
      lighting_fixtures (
        id,
        status,
        electrical_issues,
        ballast_issue
      )
    `);
  
  if (error) throw error;
  return data || [];
};

export function useRoomLightingStats() {
  return useQuery({
    queryKey: ["room-lighting-stats"],
    queryFn: fetchRoomLightingStats as any,
    staleTime: 60_000,
  });
}
