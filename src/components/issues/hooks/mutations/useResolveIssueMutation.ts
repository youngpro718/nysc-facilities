
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResolutionType } from "../../types/IssueTypes";
import { toast } from "sonner";

interface ResolveIssueData {
  id: string;
  resolution_type: ResolutionType;
  resolution_notes: string;
}

export const useResolveIssueMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resolution_type, resolution_notes }: ResolveIssueData) => {
      try {
        const { error } = await supabase
          .from("issues")
          .update({
            status: "resolved",
            resolution_type,
            resolution_notes,
            resolution_date: new Date().toISOString(),
            resolved_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq("id", id);

        if (error) throw error;
      } catch (error) {
        console.error("Supabase error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Batch invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: ['issues'],
        exact: false 
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error("Failed to resolve issue. Please try again.");
    }
  });
};
