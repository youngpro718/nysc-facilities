
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useKeyAssignments(occupantId: string) {
  const { data: keyAssignments, isLoading, refetch } = useQuery({
    queryKey: ["occupant-keys", occupantId],
    queryFn: async () => {
      console.log("Fetching key assignments for occupant:", occupantId);
      
      const { data: assignments, error: assignmentError } = await supabase
        .from("key_assignments")
        .select(`
          id,
          assigned_at,
          returned_at,
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
        .eq("occupant_id", occupantId)
        .is("returned_at", null)
        .order('assigned_at', { ascending: false });

      if (assignmentError) {
        console.error("Error fetching key assignments:", assignmentError);
        throw assignmentError;
      }

      console.log("Fetched key assignments:", assignments);
      if (!assignments || assignments.length === 0) {
        console.warn('No key assignments returned for occupant:', occupantId);
      } else {
        assignments.forEach((a: any) => {
          console.log('Assignment:', a);
        });
      }
      return assignments;
    },
    enabled: !!occupantId,
    refetchOnWindowFocus: false
  });

  const handleReturnKey = async (assignmentId: string) => {
    try {
      const { data: assignment, error: fetchError } = await supabase
        .from("key_assignments")
        .select("key_id")
        .eq("id", assignmentId)
        .single();

      if (fetchError) throw fetchError;

      const { data: newQuantity, error: rpcError } = await supabase
        .rpc('increment_key_quantity', {
          key_id: assignment.key_id
        });

      if (rpcError) throw rpcError;

      const { error: assignmentError } = await supabase
        .from("key_assignments")
        .update({
          returned_at: new Date().toISOString(),
          return_reason: "normal_return"
        })
        .eq("id", assignmentId);

      if (assignmentError) throw assignmentError;

      toast.success("Key returned successfully");
      refetch();
    } catch (error: any) {
      console.error("Error returning key:", error);
      toast.error(error.message || "Failed to return key");
    }
  };

  return {
    keyAssignments,
    isLoading,
    handleReturnKey
  };
}
