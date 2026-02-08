
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export function useKeyAssignments(occupantId: string) {
  const queryClient = useQueryClient();
  
  const { data: keyAssignments, isLoading } = useQuery({
    queryKey: ["occupant-keys", occupantId],
    queryFn: async () => {
      logger.debug("Fetching key assignments for occupant:", occupantId);
      
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
        logger.error("Error fetching key assignments:", assignmentError);
        throw assignmentError;
      }

      logger.debug("Fetched key assignments:", assignments);
      return assignments || [];
    },
    enabled: !!occupantId,
    refetchOnWindowFocus: false
  });

  const returnKeyMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      // Mark the assignment as returned
      // The trigger 'update_key_quantities_on_assignment' will automatically
      // increment the available_quantity when returned_at is set
      const { error: assignmentError } = await supabase
        .from("key_assignments")
        .update({
          returned_at: new Date().toISOString(),
          return_reason: "normal_return"
        })
        .eq("id", assignmentId);

      if (assignmentError) throw assignmentError;

      return assignmentId;
    },
    onSuccess: () => {
      // Invalidate and refetch key assignments
      queryClient.invalidateQueries({ queryKey: ["occupant-keys", occupantId] });
      queryClient.invalidateQueries({ queryKey: ["keys"] });
      toast.success("Key returned successfully");
    },
    onError: (error: unknown) => {
      logger.error("Error returning key:", error);
      toast.error(error.message || "Failed to return key");
    }
  });

  const handleReturnKey = async (assignmentId: string) => {
    await returnKeyMutation.mutateAsync(assignmentId);
  };

  return {
    keyAssignments,
    isLoading,
    handleReturnKey,
    isReturning: returnKeyMutation.isPending
  };
}
