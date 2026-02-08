
import { useQuery } from "@tanstack/react-query";
import { logger } from '@/lib/logger';
import { supabase } from "@/lib/supabase";
import { KeyAssignment } from "../types/assignmentTypes";

export function useKeyAssignments() {
  return useQuery({
    queryKey: ["active-key-assignments"],
    queryFn: async () => {
      const { data: assignments, error: assignmentError } = await supabase
        .from("key_assignments")
        .select(`
          id,
          assigned_at,
          is_spare,
          spare_key_reason,
          recipient_name,
          recipient_email,
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
            email,
            department
          )
        `)
        .is("returned_at", null)
        .order('assigned_at', { ascending: false });

      if (assignmentError) {
        logger.error("Error fetching assignments:", assignmentError);
        throw assignmentError;
      }

      return assignments as unknown;
    },
  });
}
