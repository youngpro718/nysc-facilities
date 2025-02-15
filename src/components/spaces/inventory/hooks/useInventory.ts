
import { useInventoryQueries } from "./useInventoryQueries";
import { useInventoryMutations } from "./useInventoryMutations";
import { LowStockItem } from "../types/inventoryTypes";

export const useInventory = (roomId: string) => {
  const { inventoryData, isLoading, lowStockData, transactionData } = useInventoryQueries(roomId);
  const mutations = useInventoryMutations(roomId);

  const lowStockItems: LowStockItem[] = (lowStockData ?? []).map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    minimum_quantity: item.minimum_quantity,
    category_id: item.category_id,
    category_name: item.category_name,
    room_id: item.room_id,
    room_name: item.room_name || '',
    storage_location: item.storage_location || ''
  }));

  const recentTransactions = (transactionData ?? []).map(transaction => ({
    id: transaction.id,
    item_id: transaction.item_id || '',
    transaction_type: transaction.transaction_type,
    quantity: transaction.quantity,
    from_room_id: transaction.from_room_id || undefined,
    to_room_id: transaction.to_room_id || undefined,
    notes: transaction.notes || undefined,
    created_at: transaction.created_at
  }));

  return {
    inventoryData,
    isLoading,
    lowStockItems,
    recentTransactions,
    ...mutations
  };
};
