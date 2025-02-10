
import { supabase } from "@/integrations/supabase/client";

export interface BackupVersion {
  id: string;
  name: string;
  description: string | null;
  size_bytes: number;
  tables: string[];
  created_at: string;
  status: string;
  metadata: any;
}

export async function createBackupVersion(backup: Partial<BackupVersion>) {
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
