import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface WorkflowEntry {
  id: string;
  request_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  change_reason: string | null;
  notes: string | null;
  metadata: any;
  created_at: string;
}

export const useKeyRequestWorkflow = (requestId: string) => {
  return useQuery<WorkflowEntry[]>({
    queryKey: ['keyRequestWorkflow', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_request_workflow')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!requestId,
  });
};

export const useUpdateKeyRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      rejectionReason,
      fulfillmentNotes
    }: {
      requestId: string;
      status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled' | 'fulfilled';
      rejectionReason?: string;
      fulfillmentNotes?: string;
    }) => {
      const updateData: any = { status };
      
      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }
      
      if (fulfillmentNotes) {
        updateData.fulfillment_notes = fulfillmentNotes;
      }

      const { error } = await supabase
        .from('key_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyRequests'] });
      queryClient.invalidateQueries({ queryKey: ['keyRequestWorkflow'] });
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
    },
  });
};