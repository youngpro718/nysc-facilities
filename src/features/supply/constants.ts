// Unified supply orders constants and approval rules

export type OrderStatus =
  | 'submitted'        // User submitted order (standard items)
  | 'pending_approval' // Awaiting admin approval (restricted items)
  | 'approved'         // Admin approved, ready for supply room
  | 'received'         // Supply room accepted order
  | 'picking'          // Worker is pulling items from shelves
  | 'ready'            // Packed and ready for pickup (inventory deducted)
  | 'completed'        // User received order
  | 'cancelled'        // Order cancelled
  | 'rejected';        // Order rejected

// 'rejected' is only reachable from 'pending_approval' — the only place the
// UI ever calls rejectSupplyRequest() is the approval queue. Orders that
// don't need approval (submitted) or are already accepted by staff
// (received) are declined via cancelSupplyRequest() instead.
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  submitted: ['received', 'cancelled'],
  pending_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['received', 'cancelled'],
  received: ['picking', 'cancelled'],
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
