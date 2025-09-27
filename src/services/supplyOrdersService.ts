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
    // Hint for back office: many schemas already have this column; if not present, Supabase will ignore extra keys when using RPC.
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

  return { ...request, approval_required: approvalRequired };
}
