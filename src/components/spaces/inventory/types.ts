
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category_id: string;
  description?: string;
  minimum_quantity?: number;
  unit?: string;
  category?: {
    name: string;
    color: string;
  };
}
