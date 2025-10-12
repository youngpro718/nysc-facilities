import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useGenerateReceipt } from '@/hooks/useSupplyReceipts';
import { createReceiptData } from '@/lib/receiptUtils';

interface MarkReadyButtonProps {
  requestId: string;
  disabled?: boolean;
}

export function MarkReadyButton({ requestId, disabled }: MarkReadyButtonProps) {
  const queryClient = useQueryClient();
  const { mutateAsync: generateReceipt } = useGenerateReceipt();

  const markReadyMutation = useMutation({
    mutationFn: async () => {
      // Update status to ready
      const { error: updateError } = await supabase
        .from('supply_requests')
        .update({ 
          status: 'ready',
          ready_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Fetch request data for receipt
      const { data: request, error: fetchError } = await supabase
        .from('supply_requests')
        .select(`
          *,
          profiles!requester_id (
            first_name,
            last_name,
            email,
            department
          ),
          supply_request_items (
            *,
            inventory_items (
              name,
              unit
            )
          )
        `)
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Generate pickup receipt
      if (request) {
        try {
          const receiptData = createReceiptData(request, 'pickup', '');
          await generateReceipt({
            requestId,
            receiptType: 'pickup',
            receiptData,
          });
        } catch (receiptError) {
          console.error('Failed to generate pickup receipt:', receiptError);
        }
      }
    },
    onSuccess: () => {
      toast({
        title: 'Order Ready',
        description: 'Order marked as ready for pickup. Receipt generated.',
      });
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark order as ready',
        variant: 'destructive',
      });
    },
  });

  return (
    <Button
      size="sm"
      onClick={() => markReadyMutation.mutate()}
      disabled={disabled || markReadyMutation.isPending}
    >
      {markReadyMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark Ready
        </>
      )}
    </Button>
  );
}
