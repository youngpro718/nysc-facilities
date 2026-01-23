// Unified supply orders constants and approval rules

export type OrderStatus =
  | 'submitted'    // User submitted order
  | 'received'     // Supply room accepted order
  | 'picking'      // Worker is pulling items from shelves
  | 'ready'        // Packed and ready for pickup (inventory deducted)
  | 'completed'    // User received order
  | 'cancelled'    // Order cancelled
  | 'rejected';    // Order rejected

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  submitted: ['received', 'cancelled', 'rejected'],
  received: ['picking', 'cancelled', 'rejected'],
  picking: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
};

// Extended inventory item interface with justification flag
export interface InventoryItemWithFlag {
  id: string;
  name: string;
  categoryName?: string | null;
  requires_justification?: boolean;
}

// Check if any cart items require justification (uses DB flag)
export function requiresJustificationForItems(items: InventoryItemWithFlag[]): boolean {
  return items.some(item => item.requires_justification === true);
}

// Legacy function - now checks the DB flag primarily
export function requiresApprovalForItems(items: InventoryItemWithFlag[]): boolean {
  return requiresJustificationForItems(items);
}
