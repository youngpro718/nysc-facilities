
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KeyAssignment } from "../types/assignmentTypes";

export function useKeyAssignments() {
  return useQuery({
    queryKey: ["active-key-assignments"],
    queryFn: async () => {
      // First, let's get the active assignments with detailed logging
      const { data: assignments, error: assignmentError } = await supabase
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
            is_passkey,
            total_quantity,
            available_quantity
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

      console.log("Active assignments:", assignments);
      
      if (assignmentError) {
        console.error("Error fetching assignments:", assignmentError);
        throw assignmentError;
      }

      // Let's also get a direct count from the keys table for verification
      const { data: keyData, error: keyError } = await supabase
        .from("keys")
        .select('id, name, total_quantity, available_quantity');

      if (keyError) {
        console.error("Error fetching key data:", keyError);
        throw keyError;
      }

      console.log("Current key quantities:", keyData);

      return assignments as unknown as KeyAssignment[];
    },
  });
}
