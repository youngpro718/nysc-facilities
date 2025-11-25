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
export const SUPPLY_REQUEST_STATUSES = [
  { value: 'submitted', label: 'Submitted', description: 'Request submitted, awaiting review' },
  { value: 'received', label: 'Received', description: 'Request received by supply room' },
  { value: 'processing', label: 'Processing', description: 'Items being gathered' },
  { value: 'ready', label: 'Ready', description: 'Ready for pickup' },
  { value: 'picked_up', label: 'Picked Up', description: 'Items collected by requester' },
  { value: 'completed', label: 'Completed', description: 'Request fulfilled' },
  { value: 'cancelled', label: 'Cancelled', description: 'Request cancelled' },
] as const;
