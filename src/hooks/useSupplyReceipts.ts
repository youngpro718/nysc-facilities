import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ReceiptData } from '@/types/receipt';

export function useSupplyReceipts(requestId?: string) {
  return useQuery({
    queryKey: ['supply-receipts', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      
      const { data, error } = await supabase
        .from('supply_request_receipts')
        .select('*')
        .eq('request_id', requestId)
        .order('generated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });
}

export function useGenerateReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      requestId, 
      receiptType, 
      receiptData 
    }: { 
      requestId: string; 
      receiptType: 'confirmation' | 'pickup' | 'final';
      receiptData: ReceiptData;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate receipt number
      const { data: receiptNumber, error: funcError } = await supabase
        .rpc('generate_receipt_number', { p_type: receiptType });
      
      if (funcError) throw funcError;

      // Create receipt record
      const { data, error } = await supabase
        .from('supply_request_receipts')
        .insert({
          request_id: requestId,
          receipt_type: receiptType,
          receipt_number: receiptNumber,
          generated_by: user.id,
          pdf_data: receiptData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supply-receipts', variables.requestId] });
      toast.success('Receipt generated successfully');
    },
    onError: (error) => {
      logger.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    },
  });
}
