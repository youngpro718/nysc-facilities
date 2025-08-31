// Placeholder lighting service to resolve imports
import { supabase } from './supabase';

export * from './supabase';

// Re-export common functionality that might be expected
export const lightingService = {
  supabase
};