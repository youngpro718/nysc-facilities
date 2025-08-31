
// Re-export all types from integrations
export * from '@/integrations/supabase/types';

// Also directly export commonly needed types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
