import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalSystemSettings {
  id: string;
  maintenanceMode: boolean;
  autoBackups: boolean;
  userRegistration: boolean;
  emailNotifications: boolean;
  auditLogging: boolean;
  systemName: string;
  adminEmail: string;
  welcomeMessage: string;
  backupRetention: number;
  logLevel: string;
}

function mapFromDb(row: any): GlobalSystemSettings {
  return {
    id: row.id,
    maintenanceMode: !!row.maintenance_mode,
    autoBackups: !!row.auto_backups,
    userRegistration: !!row.user_registration,
    emailNotifications: !!row.email_notifications,
    auditLogging: !!row.audit_logging,
    systemName: row.system_name ?? '',
    adminEmail: row.admin_email ?? '',
    welcomeMessage: row.welcome_message ?? '',
    backupRetention: Number(row.backup_retention ?? 30),
    logLevel: row.log_level ?? 'info',
  };
}

function mapToDb(settings: Partial<GlobalSystemSettings>) {
  const mapped: Record<string, any> = {};
  if ('maintenanceMode' in settings) mapped.maintenance_mode = settings.maintenanceMode;
  if ('autoBackups' in settings) mapped.auto_backups = settings.autoBackups;
  if ('userRegistration' in settings) mapped.user_registration = settings.userRegistration;
  if ('emailNotifications' in settings) mapped.email_notifications = settings.emailNotifications;
  if ('auditLogging' in settings) mapped.audit_logging = settings.auditLogging;
  if ('systemName' in settings) mapped.system_name = settings.systemName;
  if ('adminEmail' in settings) mapped.admin_email = settings.adminEmail;
  if ('welcomeMessage' in settings) mapped.welcome_message = settings.welcomeMessage;
  if ('backupRetention' in settings) mapped.backup_retention = settings.backupRetention;
  if ('logLevel' in settings) mapped.log_level = settings.logLevel;
  return mapped;
}

export function useGlobalSystemSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['global-system-settings'],
    queryFn: async (): Promise<GlobalSystemSettings | null> => {
      // Try to fetch the singleton row
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Attempt to create a default row (admin-only)
        const { data: inserted, error: insertError } = await supabase
          .from('system_settings')
          .insert({ key: 'default' })
          .select('*')
          .single();
        if (insertError) {
          // Return null; UI can handle
          return null;
        }
        return mapFromDb(inserted);
      }

      return mapFromDb(data);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { mutateAsync: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async (patch: Partial<GlobalSystemSettings>) => {
      // Get current row id from cache
      const current = queryClient.getQueryData<GlobalSystemSettings | null>(['global-system-settings']);
      if (!current) return false;
      const update = mapToDb(patch);
      const { data, error } = await supabase
        .from('system_settings')
        .update(update)
        .eq('id', current.id)
        .select('*')
        .single();
      if (error) throw error;
      // Update cache with new values
      queryClient.setQueryData(['global-system-settings'], mapFromDb(data));
      return true;
    },
  });

  return {
    settings,
    isLoading,
    isSaving,
    saveSettings,
  };
}
