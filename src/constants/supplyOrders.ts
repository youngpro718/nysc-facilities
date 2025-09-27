// Unified supply orders constants and approval rules

export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'received'
  | 'processing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['received', 'cancelled'],
  received: ['processing', 'rejected', 'cancelled'],
  processing: ['ready', 'cancelled'],
  ready: ['picked_up', 'delivered', 'completed'],
  picked_up: ['completed'],
  delivered: ['completed'],
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
