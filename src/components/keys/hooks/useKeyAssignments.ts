
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

      // Let's get specific details for key #31
      const { data: keyDetails, error: keyError } = await supabase
        .from("keys")
        .select("*")
        .eq('name', '31')
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (keyError) {
        console.error("Error fetching key details:", keyError);
        throw keyError;
      }

      console.log("Key #31 details:", keyDetails);

      // Check all assignments for key #31 (including returned ones)
      const { data: key31Assignments, error: assignmentsError } = await supabase
        .from("key_assignments")
        .select("*")
        .eq('key_id', keyDetails?.id || ''); // Added optional chaining since keyDetails might be null

      if (!assignmentsError && keyDetails) {
        console.log("All assignments for key #31:", key31Assignments);
        console.log("Active assignments count:", key31Assignments.filter(a => !a.returned_at).length);
        console.log("Returned assignments count:", key31Assignments.filter(a => a.returned_at).length);
      }

      return assignments as unknown as KeyAssignment[];
    },
  });
}
