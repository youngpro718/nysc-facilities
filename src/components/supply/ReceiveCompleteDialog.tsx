import { useState, useEffect } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useGenerateReceipt } from '@/hooks/useSupplyReceipts';
import { createReceiptData } from '@/lib/receiptUtils';

interface ReceiveCompleteDialogProps {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function ReceiveCompleteDialog({ request, open, onOpenChange, userId }: ReceiveCompleteDialogProps) {
  const [fulfilledQuantities, setFulfilledQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();
  const { mutateAsync: generateReceipt } = useGenerateReceipt();

  // Initialize quantities when dialog opens
  useEffect(() => {
    if (request && open) {
      const initialQuantities: Record<string, number> = {};
      request.supply_request_items?.forEach((item: any) => {
        initialQuantities[item.item_id] = item.quantity_requested;
      });
      setFulfilledQuantities(initialQuantities);
    }
  }, [request, open]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting order completion...', { requestId: request.id, fulfilledQuantities });
      
      if (!userId) throw new Error('Not authenticated');

      // Update request status
      console.log('Updating request status to completed...');
      const { error: requestError } = await supabase
        .from('supply_requests')
        .update({
          status: 'completed',
          fulfilled_by: userId,
          fulfilled_at: new Date().toISOString(),
          fulfillment_notes: notes
        })
        .eq('id', request.id);

      if (requestError) {
        console.error('Request update error:', requestError);
        throw requestError;
      }

      // Update item quantities and deduct from inventory
      for (const item of request.supply_request_items || []) {
        const fulfilledQty = fulfilledQuantities[item.item_id] || 0;
        console.log('Processing item:', { itemId: item.item_id, fulfilledQty });
        
        // Update supply request item
        const { error: itemError } = await supabase
          .from('supply_request_items')
          .update({ quantity_fulfilled: fulfilledQty })
          .eq('id', item.id);

        if (itemError) {
          console.error('Item update error:', itemError);
          throw itemError;
        }

        // Deduct from inventory using the updated function
        if (fulfilledQty > 0) {
          console.log('Deducting from inventory:', { itemId: item.item_id, qty: -fulfilledQty });
          const { error: invError } = await supabase.rpc('adjust_inventory_quantity', {
            item_id: item.item_id,
            quantity_change: -fulfilledQty,
            transaction_type: 'fulfilled',
            reference_id: request.id,
            notes: `Fulfilled supply request: ${request.title}`
          });

          if (invError) {
            console.error('Inventory adjustment error:', invError);
            throw invError;
          }
          console.log('Inventory adjusted successfully');
        }
      }
      
      // Fetch updated request data for receipt
      const { data: updatedRequest } = await supabase
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
        .eq('id', request.id)
        .single();

      // Generate final receipt
      if (updatedRequest) {
        try {
          const receiptData = createReceiptData(updatedRequest, 'final', '');
          await generateReceipt({
            requestId: request.id,
            receiptType: 'final',
            receiptData,
          });
        } catch (receiptError) {
          console.error('Failed to generate final receipt:', receiptError);
        }
      }
      
      console.log('Order completion successful');
    },
    onSuccess: () => {
      toast({
        title: "Order Completed",
        description: "The supply order has been completed and inventory updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      onOpenChange(false);
      setNotes('');
      setFulfilledQuantities({});
    },
    onError: (error) => {
      console.error('Completion mutation error:', error);
      toast({
        title: "Error Completing Order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const { error } = await supabase
        .from('supply_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', request.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Order Rejected",
        description: "The requester has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      onOpenChange(false);
    },
  });

  const requestApprovalMutation = useMutation({
    mutationFn: async () => {
      // Get supervisor - for now, just find any admin user
      const { data: supervisors } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1);

      const supervisorId = supervisors?.[0]?.user_id;

      const { error } = await supabase
        .from('supply_requests')
        .update({
          status: 'awaiting_approval',
          supervisor_id: supervisorId,
          approval_requested_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Approval Requested",
        description: "Supervisor has been notified for review.",
      });
      queryClient.invalidateQueries({ queryKey: ['supply-requests'] });
      onOpenChange(false);
    },
  });

  const handleQuantityChange = (itemId: string, value: string) => {
    const qty = parseInt(value) || 0;
    setFulfilledQuantities(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleReject = () => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      rejectMutation.mutate(reason);
    }
  };

  if (!request) return null;

  const isProcessing = completeMutation.isPending || rejectMutation.isPending || requestApprovalMutation.isPending;

  return (
    <ResponsiveDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title={`Complete: ${request.title}`}
      className="max-w-2xl"
    >
      <div className="space-y-3">
        {/* Request Info */}
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-muted-foreground">Requester</Label>
            <span className="text-sm font-medium">
              {request.profiles?.first_name} {request.profiles?.last_name}
              {request.profiles?.department && ` • ${request.profiles.department}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-muted-foreground">Priority:</Label>
            <Badge variant={request.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
              {request.priority}
            </Badge>
          </div>
        </div>

        {/* Items to Fulfill */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Items to Fulfill</Label>
          <div className="space-y-2">
            {request.supply_request_items?.map((item: any) => (
              <div key={item.id} className="border rounded-lg p-2.5 space-y-2 bg-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm line-clamp-1">{item.inventory_items?.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Req: {item.quantity_requested} {item.inventory_items?.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`qty-${item.id}`} className="text-xs whitespace-nowrap">Fulfilled:</Label>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min="0"
                    value={fulfilledQuantities[item.item_id] || 0}
                    onChange={(e) => handleQuantityChange(item.item_id, e.target.value)}
                    className="w-20 h-10 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">{item.inventory_items?.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="E.g., Only had 8 pens, provided those"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t mobile-sticky-footer">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenChange(false);
          }}
          disabled={isProcessing}
          className="min-h-11"
          size="sm"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleReject();
          }}
          disabled={isProcessing}
          className="min-h-11"
          size="sm"
        >
          {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            requestApprovalMutation.mutate();
          }}
          disabled={isProcessing}
          className="min-h-11"
          size="sm"
        >
          {requestApprovalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Need Approval'}
        </Button>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            completeMutation.mutate();
          }}
          disabled={isProcessing}
          className="min-h-11"
          size="sm"
        >
          {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete'}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}