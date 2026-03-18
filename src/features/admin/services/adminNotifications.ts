import { supabase } from '@/lib/supabase';

export type AdminNotificationSeverity = 'info' | 'warning' | 'critical';

export async function triggerAdminNotification(params: {
  title: string;
  message: string;
  severity?: AdminNotificationSeverity;
}): Promise<void> {
  const { title, message, severity = 'info' } = params;

  const { error } = await supabase
    .from('admin_notifications')
    .insert({ title, message, severity });

  if (error) {
    throw error;
  }
}
