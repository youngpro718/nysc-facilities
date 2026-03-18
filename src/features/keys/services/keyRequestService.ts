import { supabase } from '@/lib/supabase';

export interface KeyRequestData {
  reason: string;
  user_id: string;
  request_type: string;
  room_id?: string;
  room_other?: string | null;
  quantity: number;
  emergency_contact?: string | null;
  email_notifications_enabled: boolean;
}

export async function submitKeyRequest(requestData: KeyRequestData) {
  const { data, error } = await supabase
    .from('key_requests')
    .insert(requestData)
    .select()
    .single();

  if (error) throw error;
  return data;
}
