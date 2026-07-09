
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useToast } from "@shared/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorUtils";

interface TransferInput {
  itemId: string;
  itemName: string;
  fromRoomId: string;
  toRoomId: string;
  quantity?: number;
  notes?: string;
}

interface BulkTransferInput {
  items: Array<{ id: string; name: string; quantity: number }>;
  fromRoomId: string;
  toRoomId: string;
  notes?: string;
}

export function useInventoryTransfer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const transferMutation = useMutation({
    mutationFn: async ({ itemId, fromRoomId, toRoomId, quantity, notes }: TransferInput) => {
      // Update the item's storage_room_id
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          storage_room_id: toRoomId,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Log the transfer as a transaction
      const { error: logError } = await supabase
        .from('inventory_transactions')
        .insert({
          item_id: itemId,
          transaction_type: 'adjust',
          quantity: quantity || 0,
          previous_quantity: 0,
          new_quantity: 0,
          performed_by: user?.id,
          notes: `Transferred from room ${fromRoomId} to room ${toRoomId}${notes ? ': ' + notes : ''}`
        });

      // Log error is non-fatal (transaction logging may not have the table)
      if (logError) console.warn('Failed to log transfer:', logError);
    },
    onSuccess: (_, variables) => {
      // Invalidate both room inventories
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.fromRoomId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.toRoomId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Item transferred",
        description: `${variables.itemName} moved successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Transfer failed",
        description: getErrorMessage(error) || "Failed to transfer item",
        variant: "destructive"
      });
    }
  });

  const bulkTransferMutation = useMutation({
    mutationFn: async ({ items, fromRoomId, toRoomId, notes }: BulkTransferInput) => {
      const ids = items.map(item => item.id);

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          storage_room_id: toRoomId,
          updated_at: new Date().toISOString()
        })
        .in('id', ids);

      if (updateError) throw updateError;

      // Log the transfers as transactions
      const { error: logError } = await supabase
        .from('inventory_transactions')
        .insert(items.map(item => ({
          item_id: item.id,
          transaction_type: 'adjust',
          quantity: item.quantity || 0,
          previous_quantity: 0,
          new_quantity: 0,
          performed_by: user?.id,
          notes: `Transferred from room ${fromRoomId} to room ${toRoomId}${notes ? ': ' + notes : ''}`
        })));

      // Log error is non-fatal (transaction logging may not have the table)
      if (logError) console.warn('Failed to log bulk transfer:', logError);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.fromRoomId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.toRoomId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Items transferred",
        description: `${variables.items.length} item${variables.items.length === 1 ? '' : 's'} moved successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Transfer failed",
        description: getErrorMessage(error) || "Failed to transfer items",
        variant: "destructive"
      });
    }
  });

  return {
    transferItem: transferMutation.mutateAsync,
    isTransferring: transferMutation.isPending,
    transferBulkItems: bulkTransferMutation.mutateAsync,
    isBulkTransferring: bulkTransferMutation.isPending
  };
}
