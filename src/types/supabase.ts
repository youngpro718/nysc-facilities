// Direct re-export from integrations to avoid circular imports
export type { Database } from '@/integrations/supabase/types';

// Also directly export commonly needed types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]