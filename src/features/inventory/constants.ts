// Shared inventory-related constants
// Centralized minimum stock threshold used across the app
export const FORCED_MINIMUM = 3;

// Common units for inventory items
export const INVENTORY_UNITS = [
  'units',
  'pieces',
  'boxes',
  'packs',
  'cases',
  'rolls',
  'reams',
  'bottles',
  'cans',
  'bags',
  'pairs',
  'sets',
  'gallons',
  'liters',
  'feet',
  'meters',
] as const;

// Priority levels for supply requests
export const SUPPLY_REQUEST_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-secondary text-secondary-foreground' },
  { value: 'medium', label: 'Medium', color: 'bg-secondary text-secondary-foreground' },
  { value: 'high', label: 'High', color: 'bg-destructive/10 text-destructive' },
  { value: 'urgent', label: 'Urgent', color: 'bg-destructive text-destructive-foreground' },
] as const;

// Supply request status lifecycle
// Standard flow: submitted → received → processing → ready → completed
// Big ticket flow: submitted → pending_approval → approved/rejected → (if approved) received → processing → ready → completed
export const SUPPLY_REQUEST_STATUSES = [
  { value: 'submitted', label: 'Submitted', description: 'Request submitted, awaiting supply room', forUser: true },
  { value: 'pending_approval', label: 'Pending Approval', description: 'Requires admin approval (big ticket item)', forUser: true },
  { value: 'approved', label: 'Approved', description: 'Approved by admin, sent to supply room', forUser: true },
  { value: 'rejected', label: 'Rejected', description: 'Request rejected by admin', forUser: true },
  { value: 'received', label: 'Received', description: 'Supply room received the request', forUser: true },
  { value: 'processing', label: 'Processing', description: 'Items being gathered from inventory', forUser: true },
  { value: 'ready', label: 'Ready for Pickup', description: 'Items ready - come pick them up!', forUser: true },
  { value: 'delivered', label: 'Delivered', description: 'Items delivered to your mailbox/location', forUser: true },
  { value: 'completed', label: 'Completed', description: 'Request fulfilled', forUser: true },
  { value: 'cancelled', label: 'Cancelled', description: 'Request cancelled', forUser: true },
] as const;

// Statuses that supply staff can transition TO
export const SUPPLY_STAFF_ACTIONS = {
  submitted: ['received', 'cancelled'], // Receive or cancel
  received: ['processing', 'cancelled'], // Start processing
  processing: ['ready', 'delivered'], // Mark ready or deliver
  ready: ['completed', 'delivered'], // Complete pickup or deliver
  delivered: ['completed'], // Mark complete after delivery
} as const;

// Statuses that require admin approval
export const ADMIN_APPROVAL_STATUSES = ['pending_approval'] as const;
