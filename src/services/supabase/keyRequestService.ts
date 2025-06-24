import { supabase } from '@/integrations/supabase/client';

export interface KeyRequestPayload {
  keyName: string;
  reason: string;
  comments?: string;
  user_id: string;
}

export async function submitKeyRequest(payload: KeyRequestPayload) {
  const { keyName, reason, comments, user_id } = payload;
  const { error } = await supabase.from('key_requests').insert([
    {
      key_name: keyName,
      reason,
      comments,
      user_id
    }
  ]);
  if (error) throw error;
  return true;
}
