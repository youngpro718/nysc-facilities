
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
        console.log("Starting issue resolution for ID:", id);
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

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
        
        console.log("Issue resolved successfully");
        return { id, success: true };
      } catch (error) {
        console.error("Supabase error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Resolution mutation succeeded:", data);
      
      // Instead of using setTimeout, invalidate the queries immediately
      // but do it in a controlled way to prevent UI freezes
      queryClient.invalidateQueries({ 
        queryKey: ['issues'],
        exact: false 
      });
      
      toast.success("Issue resolved successfully");
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error("Failed to resolve issue. Please try again.");
    }
  });
};
