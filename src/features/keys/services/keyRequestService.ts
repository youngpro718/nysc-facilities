import { supabase } from '@/lib/supabase';

export interface KeyRequestData {
  user_id: string;
  request_type: 'new' | 'spare' | 'replacement' | 'temporary';
  room_id?: string | null;
  room_other?: string | null;
  reason: string;
  quantity: number;
  emergency_contact?: string | null;
  email_notifications_enabled?: boolean;
}

export interface KeyRequestRecord {
  id: string;
  user_id: string;
  key_id: string | null;
  request_type: 'new' | 'spare' | 'replacement' | 'temporary';
  room_id: string | null;
  room_other: string | null;
  reason: string;
  quantity: number;
  status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  fulfillment_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffKeyRequest extends KeyRequestRecord {
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
  rooms: { room_number: string | null; name: string | null } | null;
}

export async function submitKeyRequest(requestData: KeyRequestData) {
  const { data, error } = await supabase
    .from('key_requests')
    .insert({
      ...requestData,
      status: 'pending',
      email_notifications_enabled: requestData.email_notifications_enabled ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listKeyRequestsForUser(userId: string): Promise<KeyRequestRecord[]> {
  const { data, error } = await supabase
    .from('key_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as KeyRequestRecord[];
}

export async function listKeyRequestsForStaff(): Promise<StaffKeyRequest[]> {
  const { data, error } = await supabase
    .from('key_requests')
    .select(`
      id, user_id, key_id, request_type, room_id, room_other, reason, quantity,
      status, admin_notes, rejection_reason, fulfillment_notes, created_at, updated_at,
      profiles!user_id(first_name, last_name, email),
      rooms(room_number, name)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StaffKeyRequest[];
}

export async function updateKeyRequestStatus(
  id: string,
  status: 'approved' | 'rejected' | 'ready' | 'fulfilled',
  options?: { rejectionReason?: string; adminNotes?: string },
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status,
    last_status_change: now,
    updated_at: now,
  };
  if (status === 'approved') {
    updates.approved_by = user?.id ?? null;
    updates.approved_at = now;
  }
  if (status === 'rejected') {
    updates.rejected_by = user?.id ?? null;
    updates.rejected_at = now;
    if (options?.rejectionReason) {
      updates.rejection_reason = options.rejectionReason;
    }
  }
  if (options?.adminNotes) {
    updates.admin_notes = options.adminNotes;
  }
  const { error } = await supabase.from('key_requests').update(updates).eq('id', id);
  if (error) throw error;
}

/**
 * Requester self-cancel. RLS only permits this while status='pending', so we
 * only attempt it from that state — surfaced as a normal status update.
 */
export async function cancelKeyRequest(id: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('key_requests')
    .update({
      status: 'cancelled',
      last_status_change: now,
      updated_at: now,
    })
    .eq('id', id);
  if (error) throw error;
}
