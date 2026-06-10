import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BuildingFloor {
  id: string;
  name: string;
  floor_number: number;
}

export interface BuildingFloorsResult {
  building: { id: string; name: string } | null;
  floors: BuildingFloor[];
}

export function useBuildingFloors(buildingId: string | null | undefined) {
  return useQuery<BuildingFloorsResult>({
    queryKey: ["building-floors", buildingId],
    enabled: !!buildingId,
    queryFn: async () => {
      if (!buildingId) return { building: null, floors: [] };

      const [buildingRes, floorsRes] = await Promise.all([
        supabase.from("buildings").select("id, name").eq("id", buildingId).maybeSingle(),
        supabase
          .from("floors")
          .select("id, name, floor_number")
          .eq("building_id", buildingId)
          .order("floor_number", { ascending: true }),
      ]);

      if (buildingRes.error) throw buildingRes.error;
      if (floorsRes.error) throw floorsRes.error;

      return {
        building: buildingRes.data ?? null,
        floors: (floorsRes.data ?? []) as BuildingFloor[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
