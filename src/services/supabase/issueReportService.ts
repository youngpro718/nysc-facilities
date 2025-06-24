import { supabase } from '@/integrations/supabase/client';

export interface IssueReportPayload {
  type: string;
  location: string;
  description: string;
  user_id: string;
}

export async function submitIssueReport(payload: IssueReportPayload) {
  const { type, location, description, user_id } = payload;
  const { error } = await supabase.from('issues').insert([
    {
      type,
      location,
      description,
      user_id
    }
  ]);
  if (error) throw error;
  return true;
}
