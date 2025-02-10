
import { supabase } from "@/integrations/supabase/client";

export type ExportableTable = 'buildings' | 'floors' | 'rooms' | 'occupants' | 'keys' | 
  'key_assignments' | 'lighting_fixtures' | 'lighting_zones' | 'issues';

export interface BackupVersion {
  id: string;
  name: string;
  description: string | null;
  size_bytes: number;
  tables: ExportableTable[];
  created_at: string;
  status: string;
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

export async function fetchBackupVersions() {
  const { data, error } = await supabase
    .from('backup_versions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
