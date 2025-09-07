// Direct re-export from integrations to avoid circular imports
// Type will be inferred from the supabase client
export type Database = any;

// Also directly export commonly needed types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]