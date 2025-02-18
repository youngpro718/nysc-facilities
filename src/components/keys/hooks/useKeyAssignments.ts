
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KeyAssignment } from "../types/assignmentTypes";

export function useKeyAssignments() {
  return useQuery({
    queryKey: ["active-key-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_assignments")
        .select(`
          id,
          assigned_at,
          is_spare,
          spare_key_reason,
          keys (
            id,
            name,
            type,
            is_passkey
          ),
          occupant:occupants!key_assignments_occupant_id_fkey (
            id,
            first_name,
            last_name,
            department
          )
        `)
        .is("returned_at", null)
        .order('assigned_at', { ascending: false });

      console.log("Fetched assignments data:", data);
      if (error) {
        console.error("Error fetching assignments:", error);
        throw error;
      }
      return data as unknown as KeyAssignment[];
    },
  });
}
