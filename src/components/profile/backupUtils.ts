
import { supabase } from "@/integrations/supabase/client";

export type ExportableTable = 'buildings' | 'floors' | 'rooms' | 'occupants' | 'keys' | 
  'key_assignments' | 'lighting_fixtures' | 'lighting_zones' | 'issues';

export interface BackupRetentionPolicy {
  id: string;
  retention_days: number;
  max_backups: number;
  compress_backups: boolean;
  encrypt_backups: boolean;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackupVersion {
  id: string;
  name: string;
  description: string | null;
  size_bytes: number;
  tables: ExportableTable[];
  created_at: string;
  status: string;
  metadata: any;
  compressed: boolean;
  encrypted: boolean;
  compression_ratio: number | null;
  retention_policy_id: string | null;
}

export interface BackupRestoration {
  id: string;
  backup_version_id: string;
  started_at: string;
  completed_at: string | null;
  status: 'in_progress' | 'completed' | 'failed';
  error_message: string | null;
  restored_tables: string[];
  metadata: any;
}

export async function createBackupVersion(backup: Pick<BackupVersion, 'name' | 'tables' | 'size_bytes' | 'description'>) {
  const { data, error } = await supabase
    .from('backup_versions')
    .insert([backup])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchBackupVersions(): Promise<BackupVersion[]> {
  const { data, error } = await supabase
    .from('backup_versions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    tables: (item.tables || []).filter((table): table is ExportableTable => 
      isExportableTable(table)
    )
  }));
}

export async function fetchBackupPolicies(): Promise<BackupRetentionPolicy[]> {
  const { data, error } = await supabase
    .from('backup_retention_policies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createBackupPolicy(policy: Omit<BackupRetentionPolicy, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('backup_retention_policies')
    .insert([policy])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function restoreBackup(backupId: string, tables: ExportableTable[]) {
  const { data, error } = await supabase
    .from('backup_restorations')
    .insert([{
      backup_version_id: backupId,
      restored_tables: tables,
      status: 'in_progress'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Type guard to validate if a string is an ExportableTable
function isExportableTable(table: string): table is ExportableTable {
  const validTables: ExportableTable[] = [
    'buildings', 'floors', 'rooms', 'occupants', 'keys',
    'key_assignments', 'lighting_fixtures', 'lighting_zones', 'issues'
  ];
  return validTables.includes(table as ExportableTable);
}
