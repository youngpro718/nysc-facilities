// IMPORTANT: This is the ONLY file that should import directly from integrations
// All other files should import from '@/lib/supabase'

// Re-export the existing supabase client
export { supabase, supabaseWithRetry } from '../integrations/supabase/client';

// For TypeScript compatibility
import type { Database } from '../integrations/supabase/types';
export type { Database };