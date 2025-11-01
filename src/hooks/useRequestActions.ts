import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useRequestActions = () => {
  const queryClient = useQueryClient();

  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('key_requests')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('status', 'pending'); // Only allow cancelling pending requests

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyRequests'] });
      toast.success('Request cancelled successfully');
    },
    onError: (error) => {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    },
  });

  const resubmitRequest = useMutation({
    mutationFn: async ({ originalRequestId, newData }: { 
      originalRequestId: string; 
      newData: any; 
    }) => {
      // First, get the original request data
      const { data: originalRequest, error: fetchError } = await supabase
        .from('key_requests')
        .select('*')
        .eq('id', originalRequestId)
        .single();

      if (fetchError) throw fetchError;

      // Create new request with updated data
      const { error: insertError } = await supabase
        .from('key_requests')
        .insert({
          ...originalRequest,
          id: undefined, // Let it generate a new ID
          ...newData,
          status: 'pending',
          admin_notes: null,
          rejection_reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyRequests'] });
      toast.success('Request resubmitted successfully');
    },
    onError: (error) => {
      console.error('Error resubmitting request:', error);
      toast.error('Failed to resubmit request');
    },
  });

  return {
    cancelRequest: cancelRequest.mutate,
    resubmitRequest: resubmitRequest.mutate,
    isCancelling: cancelRequest.isPending,
    isResubmitting: resubmitRequest.isPending
  };
};