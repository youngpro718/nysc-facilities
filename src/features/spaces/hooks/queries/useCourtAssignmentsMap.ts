import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface RoomCourtAssignment {
  part: string | null;
  justice: string | null;
  clerks: string[] | null;
  sergeant: string | null;
}

export function useCourtAssignmentsMap() {
  return useQuery({
    queryKey: ["court_assignments_map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_assignments")
        .select("room_id, part, justice, clerks, sergeant");
      if (error) throw error;
      const map = new Map<string, RoomCourtAssignment>();
      for (const row of data ?? []) {
        if (!row.room_id) continue;
        map.set(row.room_id, {
          part: row.part ?? null,
          justice: row.justice ?? null,
          clerks: (row.clerks as string[] | null) ?? null,
          sergeant: row.sergeant ?? null,
        });
      }
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });
}
