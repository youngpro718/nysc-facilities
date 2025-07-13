import { supabase } from '@/integrations/supabase/client';

export interface KeyRequestPayload {
  reason: string;
  user_id: string;
}

export async function submitKeyRequest(payload: KeyRequestPayload) {
  const { reason, user_id } = payload;
  const { error } = await supabase.from('key_requests').insert([
    {
      reason,
      user_id,
      status: 'pending'
    }
  ]);
  if (error) throw error;
  return true;
}
