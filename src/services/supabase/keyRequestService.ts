import { supabase } from '@/integrations/supabase/client';

export interface KeyRequestPayload {
  reason: string;
  user_id: string;
  request_type: 'spare' | 'replacement' | 'new';
  room_id?: string;
  room_other?: string;
  quantity: number;
  emergency_contact?: string;
  email_notifications_enabled: boolean;
}

export async function submitKeyRequest(payload: KeyRequestPayload) {
  const { 
    reason, 
    user_id, 
    request_type, 
    room_id, 
    room_other, 
    quantity, 
    emergency_contact, 
    email_notifications_enabled 
  } = payload;
  
  const { error } = await supabase.from('key_requests').insert([
    {
      reason,
      user_id,
      request_type,
      room_id,
      room_other,
      quantity,
      emergency_contact,
      email_notifications_enabled,
      status: 'pending'
    }
  ]);
  
  if (error) throw error;
  return true;
}
