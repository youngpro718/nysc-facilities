import { supabase } from '@/lib/supabase';

export const submitSupplyRequest = async (requestData: any) => {
  const { data, error } = await supabase.from('supply_requests').insert(requestData).select().single();
  if (error) throw error;
  return data;
};

export const getSupplyRequests = async (userId?: string) => {
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
};

export const updateSupplyRequestStatus = async (
  id: string,
  status: string,
  updates: Record<string, unknown> = {}
) => {
  const { error } = await supabase
    .from('supply_requests')
    .update({ status, ...updates })
    .eq('id', id);
  if (error) throw error;
};

export const updateSupplyRequestItems = async (
  requestId: string,
  items: Array<{
    id: string;
    quantity_approved?: number | null;
    quantity_fulfilled?: number | null;
    notes?: string | null;
  }>
) => {
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
};

export const startSupplyRequestWork = async (id: string) => {
  const { error } = await supabase.from('supply_requests').update({
    work_started_at: new Date().toISOString(),
    status: 'in_progress'
  }).eq('id', id);
  if (error) throw error;
};

export const completeSupplyRequestWork = async (id: string, notes?: string) => {
  const { error } = await supabase.from('supply_requests').update({
    work_completed_at: new Date().toISOString(),
    status: 'completed',
    completion_notes: notes
  }).eq('id', id);
  if (error) throw error;
};

/**
 * Atomically fulfill a supply request: marks the header complete AND updates
 * all line items in a single server-side transaction via RPC.
 *
 * Replaces the previous pattern of separate updateSupplyRequestStatus() +
 * updateSupplyRequestItems() calls which could leave data inconsistent if
 * the second call failed after the first succeeded.
 */
export const fulfillSupplyRequest = async (
  requestId: string,
  completionNotes?: string,
  items: Array<{
    id: string;
    quantity_approved?: number | null;
    quantity_fulfilled?: number | null;
    notes?: string | null;
  }> = []
) => {
  const { error } = await supabase.rpc('fulfill_supply_request', {
    p_request_id: requestId,
    p_completion_notes: completionNotes ?? null,
    p_items: items,
  });
  if (error) throw error;
};

export const getFulfillmentLog = async (requestId: string) => {
  const { data, error } = await supabase
    .from('fulfillment_logs')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getInventoryItems = async () => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, inventory_categories(id, name)')
    .order('name');
  if (error) throw error;
  return data;
};
