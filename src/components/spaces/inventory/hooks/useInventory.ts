
import { useInventoryQueries } from './useInventoryQueries';
import { useInventoryMutations } from './useInventoryMutations';

export const useInventory = (roomId: string) => {
  const queries = useInventoryQueries(roomId);
  const mutations = useInventoryMutations(roomId);

  return {
    // Data
    inventoryData: queries.inventory.data,
    isLoading: queries.inventory.isLoading,
    error: queries.inventory.error,
    categories: queries.categories,
    transactions: queries.transactions,
    lowStockItems: queries.lowStock.data,
    
    // Mutations
    ...mutations
  };
};
