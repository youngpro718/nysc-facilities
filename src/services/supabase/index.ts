// Re-export supabase client for compatibility
export { supabase, supabaseWithRetry } from '@/lib/supabase';
export type { Database } from '@/lib/supabase';

// Re-export all lighting service functions
export * from './lightingService';

// Import supabase for additional service functions
import { supabase } from '@/lib/supabase';

// Additional service functions that are commonly used
export const createLightingFixture = async (fixtureData: any) => {
  const { data, error } = await supabase
    .from('lighting_fixtures')
    .insert(fixtureData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createLightingZone = async (zoneData: any) => {
  const { data, error } = await supabase
    .from('lighting_zones')
    .insert(zoneData)
    .select()
    .single();

  if (error) throw error;
  return data;
};