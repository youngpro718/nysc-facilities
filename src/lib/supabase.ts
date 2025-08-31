import { createClient } from '@supabase/supabase-js';

// Re-export the existing supabase client to bypass path alias issues
export { supabase, supabaseWithRetry } from '../integrations/supabase/client';