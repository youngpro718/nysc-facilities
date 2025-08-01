import { supabase } from '@/integrations/supabase/client';

export interface SupplyRequestPayload {
  title: string;
  description?: string;
  justification: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requested_delivery_date?: string;
  delivery_location?: string;
  items: {
    item_id: string;
    quantity_requested: number;
    notes?: string;
  }[];
}

export interface SupplyRequest {
  id: string;
  requester_id: string;
  title: string;
  description?: string;
  justification: string;
  priority: string;
  status: string;
  requested_delivery_date?: string;
  delivery_location?: string;
  approved_by?: string;
  fulfilled_by?: string;
  approval_notes?: string;
  fulfillment_notes?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  fulfilled_at?: string;
  metadata?: any;
}

export interface SupplyRequestItem {
  id: string;
  request_id: string;
  item_id: string;
  quantity_requested: number;
  quantity_approved?: number;
  quantity_fulfilled?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function submitSupplyRequest(payload: SupplyRequestPayload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { items, ...requestData } = payload;

  // Create the supply request
  const { data: request, error: requestError } = await supabase
    .from('supply_requests')
    .insert([
      {
        ...requestData,
        requester_id: user.id,
        delivery_location: payload.delivery_location || 'Office',
      }
    ])
    .select()
    .single();

  if (requestError) throw requestError;

  // Create the request items
  const requestItems = items.map(item => ({
    ...item,
    request_id: request.id,
  }));

  const { error: itemsError } = await supabase
    .from('supply_request_items')
    .insert(requestItems);

  if (itemsError) throw itemsError;

  return request;
}

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
  return data;
}

export async function updateSupplyRequestStatus(
  requestId: string,
  status: string,
  notes?: string
) {
  // Handle fulfillment separately using the dedicated function
  if (status === 'fulfilled') {
    const { error } = await supabase.rpc('fulfill_supply_request', {
      p_request_id: requestId,
      p_fulfillment_notes: notes
    });
    if (error) throw error;
    return;
  }

  // Handle other status updates normally
  const updates: any = { status };
  
  if (status === 'approved' || status === 'rejected') {
    updates.approval_notes = notes;
  }

  const { error } = await supabase
    .from('supply_requests')
    .update(updates)
    .eq('id', requestId);

  if (error) throw error;
}

export async function updateSupplyRequestItems(
  requestId: string,
  items: { item_id: string; quantity_approved?: number; quantity_fulfilled?: number; notes?: string }[]
) {
  // Get existing items to preserve quantity_requested
  const { data: existingItems } = await supabase
    .from('supply_request_items')
    .select('*')
    .eq('request_id', requestId);

  const updates = items.map(item => {
    const existingItem = existingItems?.find(ei => ei.item_id === item.item_id);
    return {
      ...item,
      request_id: requestId,
      quantity_requested: existingItem?.quantity_requested || 1, // Preserve existing or default to 1
    };
  });

  const { error } = await supabase
    .from('supply_request_items')
    .upsert(updates, { onConflict: 'request_id,item_id' });

  if (error) throw error;
}

export async function startSupplyRequestWork(requestId: string) {
  const { error } = await supabase.rpc('start_supply_request_work', {
    p_request_id: requestId
  });
  if (error) throw error;
}

export async function completeSupplyRequestWork(requestId: string, notes?: string) {
  const { error } = await supabase.rpc('complete_supply_request_work', {
    p_request_id: requestId,
    p_notes: notes
  });
  if (error) throw error;
}

export async function getFulfillmentLog(requestId: string) {
  const { data, error } = await supabase
    .from('supply_request_fulfillment_log')
    .select(`
      *,
      profiles!performed_by (
        first_name,
        last_name,
        department
      )
    `)
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data;
}

export async function getInventoryItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      id,
      name,
      description,
      quantity,
      minimum_quantity,
      unit,
      location_details,
      status,
      category_id,
      created_at,
      updated_at,
      inventory_categories (
        name,
        color
      )
    `)
    .order('name');

  if (error) throw error;
  
  // Ensure inventory_categories is properly handled for items without categories
  const processedData = data?.map(item => ({
    ...item,
    inventory_categories: item.inventory_categories || null
  }));
  
  return processedData || [];
}