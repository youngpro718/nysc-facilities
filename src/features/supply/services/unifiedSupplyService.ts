import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { InventoryItemWithFlag, requiresApprovalForItems, OrderStatus, STATUS_TRANSITIONS } from '@features/supply/constants';

// ============================================================================
// TYPES
// ============================================================================

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

export interface UpdateItemQuantities {
  id: string;
  quantity_approved?: number | null;
  quantity_fulfilled?: number | null;
  notes?: string | null;
}

// ============================================================================
// STATUS VALIDATION
// ============================================================================

/**
 * Validates if a status transition is allowed
 */
export function canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions?.includes(newStatus) ?? false;
}

/**
 * Validates status transition and throws if invalid
 */
function validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
  if (!canTransitionTo(currentStatus, newStatus)) {
    throw new Error(
      `Invalid status transition: cannot move from '${currentStatus}' to '${newStatus}'`
    );
  }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Fetch supply requests with full hydration
 */
export async function getSupplyRequests(userId?: string) {
  let query = supabase
    .from('supply_requests')
    .select(`
      *,
      profiles!requester_id (
        first_name,
        last_name,
        email,
        department
      ),
      assigned_fulfiller:profiles!assigned_fulfiller_id (
        first_name,
        last_name
      ),
      supply_request_items (
        *,
        inventory_items (
          name,
          unit,
          quantity,
          category_id,
          inventory_categories (
            name,
            color
          )
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('requester_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  if (data && data.length > 0) {
    const fulfilledByIds = [...new Set(data.map((r: any) => r.fulfilled_by).filter(Boolean))] as string[];

    if (fulfilledByIds.length > 0) {
      const { data: fulfillerProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', fulfilledByIds);

      const fulfillerMap = new Map((fulfillerProfiles || []).map((p: any) => [p.id, p]));

      return data.map((request: any) => ({
        ...request,
        completed_by: request.fulfilled_by ? fulfillerMap.get(request.fulfilled_by) || null : null
      }));
    }
  }

  return data;
}

/**
 * Fetch inventory items
 */
export async function getInventoryItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, inventory_categories(id, name)')
    .order('name');
  if (error) throw error;
  return data;
}

/**
 * Fetch fulfillment log for a request
 */
export async function getFulfillmentLog(requestId: string) {
  const { data, error } = await supabase
    .from('fulfillment_logs')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ============================================================================
// SUBMISSION & APPROVAL
// ============================================================================

/**
 * Submit a new supply order
 * Automatically determines if approval is required based on item flags
 */
export async function submitSupplyOrder(payload: SubmitOrderPayload) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Authentication required. Please refresh and try again.');
  }

  // Fetch inventory details to check approval requirements
  const itemIds = Array.from(new Set(payload.items.map(i => i.item_id)));
  const { data: inv, error: invErr } = await supabase
    .from('inventory_items')
    .select('id, name, requires_justification, inventory_categories(name)')
    .in('id', itemIds);
  if (invErr) throw new Error(`Failed to fetch inventory: ${invErr.message}`);

  const liteItems: InventoryItemWithFlag[] = (inv || []).map((i: any) => ({
    id: i.id as string,
    name: i.name as string,
    categoryName: i.inventory_categories?.name ?? null,
    requires_justification: i.requires_justification ?? false,
  }));

  const approvalRequired = requiresApprovalForItems(liteItems);

  const insertData: Record<string, unknown> = {
    requester_id: session.user.id,
    title: payload.title,
    description: payload.description || '',
    justification: approvalRequired
      ? `[APPROVAL REQUIRED] ${payload.justification}`
      : payload.justification,
    priority: payload.priority,
    requested_delivery_date: payload.requested_delivery_date || null,
    delivery_location: payload.delivery_location || '',
    status: approvalRequired ? 'pending_approval' : 'submitted',
    approval_notes: approvalRequired ? 'approval_required:auto' : null,
  };

  const { data: request, error: reqErr } = await supabase
    .from('supply_requests')
    .insert(insertData)
    .select('*')
    .single();
  if (reqErr) {
    if (reqErr.message?.includes('row-level security')) {
      throw new Error('Permission denied. Please ensure you are logged in.');
    }
    throw new Error(`Failed to create request: ${reqErr.message}`);
  }

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
  if (itemErr) {
    logger.error('Failed to insert request items, rolling back header record:', itemErr);
    await supabase.from('supply_requests').delete().eq('id', request.id);
    throw new Error(`Failed to save order items: ${itemErr.message}`);
  }

  // Add initial history event
  try {
    await supabase
      .from('supply_request_status_history')
      .insert({
        request_id: request.id,
        status: 'submitted',
        notes: approvalRequired ? 'Auto-flagged: approval required' : null,
        changed_by: session.user.id,
        changed_at: new Date().toISOString(),
      });
  } catch (histErr) {
    logger.error('Failed to record status history — audit gap:', histErr);
  }

  return { request, approval_required: approvalRequired };
}

/**
 * Approve a supply request (admin/supervisor only)
 */
export async function approveSupplyRequest(requestId: string, notes?: string) {
  const { data: request, error: fetchErr } = await supabase
    .from('supply_requests')
    .select('status')
    .eq('id', requestId)
    .single();
  if (fetchErr) throw fetchErr;

  validateStatusTransition(request.status, 'approved');

  const { data: updatedRequest, error } = await supabase
    .from('supply_requests')
    .update({
      status: 'approved',
      approval_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', request.status)
    .select('id')
    .maybeSingle();

  if (error) throw error;

  if (!updatedRequest) {
    throw new Error('This request was already processed by another user.');
  }
}

/**
 * Reject a supply request (admin/supervisor only)
 */
export async function rejectSupplyRequest(requestId: string, reason: string) {
  const { data: request, error: fetchErr } = await supabase
    .from('supply_requests')
    .select('status')
    .eq('id', requestId)
    .single();
  if (fetchErr) throw fetchErr;

  validateStatusTransition(request.status, 'rejected');

  const { data: updatedRequest, error } = await supabase
    .from('supply_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', request.status)
    .select('id')
    .maybeSingle();

  if (error) throw error;

  if (!updatedRequest) {
    throw new Error('This request was already processed by another user.');
  }
}

// ============================================================================
// FULFILLMENT WORKFLOW
// ============================================================================

/**
 * Accept an order and assign it to the current user (supply staff)
 */
export async function acceptOrder(requestId: string, userId: string) {
  const { data: request, error: fetchErr } = await supabase
    .from('supply_requests')
    .select('status')
    .eq('id', requestId)
    .single();
  if (fetchErr) throw fetchErr;

  validateStatusTransition(request.status, 'received');

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
  const { data: request, error: fetchErr } = await supabase
    .from('supply_requests')
    .select('status')
    .eq('id', requestId)
    .single();
  if (fetchErr) throw fetchErr;

  validateStatusTransition(request.status, 'picking');

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
  const { data: request, error: fetchErr } = await supabase
    .from('supply_requests')
    .select('status')
    .eq('id', requestId)
    .single();
  if (fetchErr) throw fetchErr;

  validateStatusTransition(request.status, 'ready');

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
      const { error: itemError } = await supabase
        .from('supply_request_items')
        .update({ quantity_fulfilled: item.quantity_fulfilled })
        .eq('request_id', requestId)
        .eq('item_id', item.item_id);

      if (itemError) throw itemError;

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
 * Complete an order (staff marks as picked up)
 */
export async function completeOrder(
  requestId: string,
  userId: string,
  notes?: string
) {
  const { data: request, error: fetchErr } = await supabase
    .from('supply_requests')
    .select('status')
    .eq('id', requestId)
    .single();
  if (fetchErr) throw fetchErr;

  validateStatusTransition(request.status, 'completed');

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

  const { data: request, error: fetchErr } = await supabase
    .from('supply_requests')
    .select('status, requester_id')
    .eq('id', requestId)
    .single();
  if (fetchErr) throw fetchErr;

  if (request.requester_id !== user.id) {
    throw new Error('Only the requester can confirm pickup');
  }

  validateStatusTransition(request.status, 'completed');

  const { error } = await supabase
    .from('supply_requests')
    .update({
      status: 'completed',
      fulfilled_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Staff marks a supply request as completed (picked up by requester)
 */
export async function staffCompletePickup(requestId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const allowedRoles = ['admin', 'court_aide', 'cmc', 'facilities_manager'];
  if (!roleData || !allowedRoles.includes(roleData.role)) {
    throw new Error('Only supply staff can complete pickup on behalf of others');
  }

  const { data: request, error: fetchErr } = await supabase
    .from('supply_requests')
    .select('status')
    .eq('id', requestId)
    .single();
  if (fetchErr) throw fetchErr;

  validateStatusTransition(request.status, 'completed');

  const { error } = await supabase
    .from('supply_requests')
    .update({
      status: 'completed',
      fulfilled_at: new Date().toISOString(),
      fulfilled_by: user.id,
    })
    .eq('id', requestId);

  if (error) throw error;
}

// ============================================================================
// ATOMIC FULFILLMENT (uses RPC)
// ============================================================================

/**
 * Atomically fulfill a supply request using the database RPC
 * This ensures header + items are updated together in a transaction
 */
export async function fulfillSupplyRequest(
  requestId: string,
  completionNotes?: string,
  items: UpdateItemQuantities[] = []
) {
  const { error } = await supabase.rpc('fulfill_supply_request', {
    p_request_id: requestId,
    p_completion_notes: completionNotes ?? null,
    p_items: items,
  });
  if (error) throw error;
}

// ============================================================================
// DELETION (admin only)
// ============================================================================

/**
 * Delete a supply request and all related data (admin only)
 * RLS policies ensure only admins can perform this action
 */
export async function deleteSupplyRequest(requestId: string): Promise<void> {
  // Delete status history first (child records)
  const { error: historyError } = await supabase
    .from('supply_request_status_history')
    .delete()
    .eq('request_id', requestId);

  if (historyError) {
    logger.error('Failed to delete status history:', historyError);
  }

  // Delete request items (child records)
  const { error: itemsError } = await supabase
    .from('supply_request_items')
    .delete()
    .eq('request_id', requestId);

  if (itemsError) {
    logger.error('Failed to delete request items:', itemsError);
    throw new Error(`Failed to delete request items: ${itemsError.message}`);
  }

  // Delete the main request
  const { error: requestError } = await supabase
    .from('supply_requests')
    .delete()
    .eq('id', requestId);

  if (requestError) {
    throw new Error(`Failed to delete request: ${requestError.message}`);
  }
}

/**
 * Delete multiple supply requests (admin only)
 */
export async function deleteMultipleSupplyRequests(requestIds: string[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const id of requestIds) {
    try {
      await deleteSupplyRequest(id);
      success++;
    } catch (error) {
      logger.error(`Failed to delete request ${id}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

// ============================================================================
// CANCELLATION & ARCHIVAL
// ============================================================================

/**
 * Cancel a supply request (requester or admin)
 */
export async function cancelSupplyRequest(requestId: string, reason?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: request, error: fetchError } = await supabase
    .from('supply_requests')
    .select('status, requester_id')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;

  validateStatusTransition(request.status, 'cancelled');

  if (request.requester_id !== user.id) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const allowedRoles = ['admin', 'facilities_manager'];
    if (!roleData || !allowedRoles.includes(roleData.role)) {
      throw new Error('Only the requester or admin can cancel this request');
    }
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

// ============================================================================
// LEGACY COMPATIBILITY (deprecated - use specific functions above)
// ============================================================================

/**
 * @deprecated Use specific workflow functions instead
 */
export async function updateSupplyRequestStatus(
  id: string,
  status: string,
  updates: Record<string, unknown> = {}
) {
  const { error } = await supabase
    .from('supply_requests')
    .update({ status, ...updates })
    .eq('id', id);
  if (error) throw error;
}

/**
 * @deprecated Use markOrderReady or fulfillSupplyRequest instead
 */
export async function updateSupplyRequestItems(
  requestId: string,
  items: UpdateItemQuantities[]
) {
  if (!items.length) return;

  const results = await Promise.all(
    items.map((item) =>
      supabase
        .from('supply_request_items')
        .update({
          quantity_approved: item.quantity_approved ?? null,
          quantity_fulfilled: item.quantity_fulfilled ?? null,
          notes: item.notes ?? null,
        })
        .eq('request_id', requestId)
        .eq('id', item.id)
    )
  );

  const firstError = results.find((r: any) => r?.error)?.error;
  if (firstError) throw firstError;
}
