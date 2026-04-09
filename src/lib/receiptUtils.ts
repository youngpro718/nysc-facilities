import type { ReceiptData } from '@features/supply/types/receipt';

interface RequestItem {
  quantity_requested?: number;
  quantity_approved?: number;
  quantity_fulfilled?: number;
  inventory_items?: {
    name?: string;
    unit?: string;
  } | null;
}

interface RequestProfile {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  department?: string | null;
}

interface SupplyRequestInput {
  id: string;
  title?: string;
  status?: string;
  priority?: string;
  created_at: string;
  approved_at?: string;
  ready_at?: string;
  fulfilled_at?: string;
  fulfilled_by?: string;
  approval_notes?: string;
  fulfillment_notes?: string;
  notes?: string;
  profiles?: RequestProfile | null;
  supply_request_items?: RequestItem[];
}

function getReceiptType(status: string): 'confirmation' | 'pickup' | 'final' {
  if (status === 'completed') return 'final';
  if (status === 'ready') return 'pickup';
  return 'confirmation';
}

export function createReceiptData(
  request: SupplyRequestInput,
  receiptType?: 'confirmation' | 'pickup' | 'final',
  receiptNumber?: string
): ReceiptData {
  const type = receiptType || getReceiptType(request.status || 'pending');
  const number = receiptNumber || `RCP-${request.id.slice(0, 8).toUpperCase()}`;

  const requesterName = request.profiles
    ? `${request.profiles.first_name || ''} ${request.profiles.last_name || ''}`.trim() || 'Unknown'
    : 'Unknown';

  const items = (request.supply_request_items || []).map((item) => ({
    name: item.inventory_items?.name || 'Unknown Item',
    quantityRequested: item.quantity_requested || 0,
    quantityApproved: item.quantity_approved,
    quantityFulfilled: item.quantity_fulfilled,
    unit: item.inventory_items?.unit || 'unit',
  }));

  return {
    receiptNumber: number,
    receiptType: type,
    generatedAt: new Date().toISOString(),
    request: {
      id: request.id,
      title: request.title || 'Supply Request',
      status: request.status || 'pending',
      priority: request.priority || 'medium',
      submittedAt: request.created_at,
    },
    requester: {
      name: requesterName,
      email: request.profiles?.email || '',
      department: request.profiles?.department || 'Unknown',
    },
    items,
    timeline: {
      submitted: request.created_at,
      approved: request.approved_at,
      ready: request.ready_at,
      completed: request.fulfilled_at,
    },
    notes: request.fulfillment_notes || request.approval_notes || request.notes,
    completedBy: request.fulfilled_by ? 'Supply Room Staff' : undefined,
  };
}
