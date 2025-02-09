
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QueryObserverResult } from "@tanstack/react-query";
import { GroupedIssues } from "./useIssueData";

type RefetchFunction = (options?: { throwOnError?: boolean }) => Promise<QueryObserverResult<GroupedIssues, Error>>;

export const useIssueActions = (refetch: RefetchFunction) => {
  const handleDeleteIssue = async (id: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Issue deleted successfully");
      await refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete issue");
    }
  };

  const handleMarkAsSeen = async (id: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ seen: true })
        .eq('id', id);

      if (error) throw error;
      await refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark issue as seen");
    }
  };

  const handleUpdate = async () => {
    await refetch();
  };

  return {
    handleDeleteIssue,
    handleMarkAsSeen,
    handleUpdate
  };
};
