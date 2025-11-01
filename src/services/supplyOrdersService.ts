import { supabase } from '@/lib/supabase';
import { InventoryLite, requiresApprovalForItems } from '@/constants/supplyOrders';

export interface SubmitOrderItem {
  item_id: string;
  quantity_requested: number;
  notes?: string;
}

export interface SubmitOrderPayload {
  title: string;
  description?: string;
  justification: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requested_delivery_date?: string | null;
  delivery_location?: string;
  items: SubmitOrderItem[];
}

export async function submitSupplyOrder(payload: SubmitOrderPayload) {
  // Verify authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Authentication required. Please refresh and try again.');
  }

  // Fetch minimal inventory details to evaluate approval policy
  const itemIds = Array.from(new Set(payload.items.map(i => i.item_id)));
  const { data: inv, error: invErr } = await supabase
    .from('inventory_items')
    .select('id, name, inventory_categories(name)')
    .in('id', itemIds);
  if (invErr) throw invErr;

  const liteItems: InventoryLite[] = (inv || []).map((i: any) => ({
    id: i.id,
    name: i.name,
    categoryName: i.inventory_categories?.name ?? null,
  }));

  const approvalRequired = requiresApprovalForItems(liteItems);

  // Compose insert payload compatible with current schema
  const insertData: any = {
    title: payload.title,
    description: payload.description || '',
    justification: approvalRequired
      ? `[APPROVAL REQUIRED] ${payload.justification}`
      : payload.justification,
    priority: payload.priority,
    requested_delivery_date: payload.requested_delivery_date || null,
    delivery_location: payload.delivery_location || '',
    status: 'submitted',
    approval_notes: approvalRequired ? 'approval_required:auto' : null,
  };

  // Insert supply request (root)
  const { data: request, error: reqErr } = await supabase
    .from('supply_requests')
    .insert(insertData)
    .select('*')
    .single();
  if (reqErr) throw reqErr;

  // Insert line items
  const itemsRows = payload.items.map(it => ({
    request_id: request.id,
    item_id: it.item_id,
    quantity_requested: it.quantity_requested,
    notes: it.notes || null,
  }));

  const { error: itemErr } = await supabase
    .from('supply_request_items')
    .insert(itemsRows);
  if (itemErr) throw itemErr;

  // Add initial history event
  const { error: histErr } = await supabase
    .from('supply_request_status_history')
    .insert({
      request_id: request.id,
      status: 'submitted',
      notes: approvalRequired ? 'Auto-flagged: approval required' : null,
      changed_at: new Date().toISOString(),
    });
  if (histErr) throw histErr;

  return { request, approval_required: approvalRequired };
}

/**
 * Accept an order and assign it to the current user
 */
export async function acceptOrder(requestId: string, userId: string) {
  const { error } = await supabase
    .from('supply_requests')
    .update({
      status: 'received',
      assigned_fulfiller_id: userId,
      work_started_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Start picking items for an order
 */
export async function startPicking(requestId: string) {
  const { error } = await supabase
    .from('supply_requests')
    .update({
      status: 'picking',
      picking_started_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Mark order as ready and deduct inventory
 */
export async function markOrderReady(
  requestId: string,
  items: Array<{ item_id: string; quantity_fulfilled: number }>
) {
  // Update request status
  const { error: statusError } = await supabase
    .from('supply_requests')
    .update({
      status: 'ready',
      picking_completed_at: new Date().toISOString(),
      ready_for_delivery_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (statusError) throw statusError;

  // Update item quantities and deduct inventory
  for (const item of items) {
    if (item.quantity_fulfilled > 0) {
      // Update supply request item
      const { error: itemError } = await supabase
        .from('supply_request_items')
        .update({ quantity_fulfilled: item.quantity_fulfilled })
        .eq('request_id', requestId)
        .eq('item_id', item.item_id);

      if (itemError) throw itemError;

      // Deduct from inventory
      const { error: invError } = await supabase.rpc('adjust_inventory_quantity', {
        p_item_id: item.item_id,
        p_quantity_change: -item.quantity_fulfilled,
        p_transaction_type: 'fulfilled',
        p_reference_id: requestId,
        p_notes: `Order ready for pickup`,
      });

      if (invError) throw invError;
    }
  }
}

/**
 * Complete an order (user picked up or delivered)
 */
export async function completeOrder(
  requestId: string,
  userId: string,
  notes?: string
) {
  const { error } = await supabase
    .from('supply_requests')
    .update({
      status: 'completed',
      fulfilled_by: userId,
      fulfilled_at: new Date().toISOString(),
      fulfillment_notes: notes || null,
    })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Confirm pickup by requester (user confirms they picked up their order)
 */
export async function confirmPickup(requestId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('supply_requests')
    .update({
      status: 'completed',
      fulfilled_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('requester_id', user.id); // Security: only requester can confirm

  if (error) throw error;
}

/**
 * Cancel a supply request (only requester can cancel)
 */
export async function cancelSupplyRequest(requestId: string, reason?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Only allow canceling pending/submitted/received requests
  const { data: request, error: fetchError } = await supabase
    .from('supply_requests')
    .select('status, requester_id')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;
  if (request.requester_id !== user.id) {
    throw new Error('Only the requester can cancel this request');
  }
  if (!['pending', 'submitted', 'received'].includes(request.status)) {
    throw new Error('Cannot cancel request in current status');
  }

  const { error } = await supabase
    .from('supply_requests')
    .update({
      status: 'cancelled',
      rejection_reason: reason || 'Cancelled by requester',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Archive a completed request (soft delete)
 */
export async function archiveSupplyRequest(requestId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('supply_requests')
    .update({
      metadata: { archived: true, archived_at: new Date().toISOString() }
    })
    .eq('id', requestId)
    .eq('requester_id', user.id);

  if (error) throw error;
}
