import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface KeyAssignmentRow {
  id: string;
  assigned_at: string;
  is_spare: boolean | null;
  recipient_name: string | null;
  recipient_email: string | null;
  occupant: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    department: string | null;
  } | null;
}

export function useKeyAssignmentsForKey(keyId: string | null | undefined) {
  return useQuery({
    queryKey: ["key-assignments-for-key", keyId],
    enabled: !!keyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_assignments")
        .select(
          `id, assigned_at, is_spare, recipient_name, recipient_email,
           occupant:occupants!key_assignments_occupant_id_fkey (
             id, first_name, last_name, email, department
           )`
        )
        .eq("key_id", keyId!)
        .is("returned_at", null)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as KeyAssignmentRow[];
    },
    staleTime: 1000 * 60 * 2,
  });
}
