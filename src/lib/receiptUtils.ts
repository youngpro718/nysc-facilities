// @ts-nocheck
import type { ReceiptData } from '@/types/receipt';

export function createReceiptData(
  request: Record<string, unknown>,
  receiptType: 'confirmation' | 'pickup' | 'final',
  receiptNumber: string
): ReceiptData {
  const requesterName = request.profiles 
    ? `${request.profiles.first_name || ''} ${request.profiles.last_name || ''}`.trim() || 'Unknown'
    : 'Unknown';

  const items = (request.supply_request_items || []).map((item: Record<string, unknown>) => ({
    name: item.inventory_items?.name || 'Unknown Item',
    quantityRequested: item.quantity_requested || 0,
    quantityApproved: item.quantity_approved,
    quantityFulfilled: item.quantity_fulfilled,
    unit: item.inventory_items?.unit || 'unit',
  }));

  return {
    receiptNumber,
    receiptType,
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
    notes: request.fulfillment_notes || request.approval_notes,
    completedBy: request.fulfilled_by ? 'Supply Room Staff' : undefined,
  };
}
