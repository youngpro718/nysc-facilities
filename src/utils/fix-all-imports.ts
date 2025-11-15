// This file exports the correct supabase client for all components to use
export { supabase, supabaseWithRetry } from '@/lib/supabase';

// Re-export commonly used items for lighting service compatibility
export * from '@/lib/supabase';