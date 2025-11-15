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

// Simple heuristic rules for approvals without requiring DB schema changes.
// We derive from category names and item names.
const HIGH_TICKET_CATEGORIES = new Set<string>([
  'Furniture',
  'Electronics',
]);

const HIGH_TICKET_KEYWORDS = [
  'chair',
  'couch',
  'sofa',
  'desk',
  'table',
  'cabinet',
  'printer',
  'monitor',
];

const RESTRICTED_CATEGORIES = new Set<string>([
  'Electronics',
  'IT Equipment',
]);

export interface InventoryLite {
  id: string;
  name: string;
  categoryName?: string | null;
}

export function isHighTicketItem(item: InventoryLite): boolean {
  const name = (item.name || '').toLowerCase();
  const inHighTicketCategory = item.categoryName ? HIGH_TICKET_CATEGORIES.has(item.categoryName) : false;
  const hasKeyword = HIGH_TICKET_KEYWORDS.some(k => name.includes(k));
  return inHighTicketCategory || hasKeyword;
}

export function isRestrictedItem(item: InventoryLite): boolean {
  return item.categoryName ? RESTRICTED_CATEGORIES.has(item.categoryName) : false;
}

export function requiresApprovalForItems(items: InventoryLite[]): boolean {
  return items.some(it => isHighTicketItem(it) || isRestrictedItem(it));
}
