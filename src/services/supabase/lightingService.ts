// Re-export supabase client for compatibility
export { supabase, supabaseWithRetry } from '@/lib/supabase';
export type { Database } from '@/lib/supabase';

// Import supabase for the service functions
import { supabase } from '@/lib/supabase';
import type { LightStatus } from '@/types/lighting';

// Lighting service functions
export const fetchLightingFixtures = async () => {
  const { data, error } = await supabase
    .from('lighting_fixtures')
    .select(`
      *,
      lighting_zones (
        id,
        name,
        type
      ),
      spatial_assignments (
        id,
        space_id,
        space_type,
        position,
        sequence_number
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchLightingZones = async () => {
  const { data, error } = await supabase
    .from('lighting_zones')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const fetchFloorsForZones = async () => {
  const { data, error } = await supabase
    .from('floors')
    .select('id, name, floor_number')
    .order('floor_number');
  
  if (error) throw error;
  return data || [];
};

export const fetchRoomLightingStats = async () => {
  const { data, error } = await supabase
    .from('unified_spaces')
    .select(`
      id,
      name,
      room_number,
      lighting_fixtures (
        id,
        status,
        electrical_issues,
        ballast_issue
      )
    `);
  
  if (error) throw error;
  return data || [];
};

export const deleteLightingFixture = async (id: string) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

export const deleteLightingFixtures = async (fixtureIds: string[]) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .delete()
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

export const updateLightingFixturesStatus = async (fixtureIds: string[], status: LightStatus) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ status })
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

export const markLightsOut = async (fixtureId: string) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ status: 'out' as LightStatus })
    .eq('id', fixtureId);
  
  if (error) throw error;
  return true;
};

export const markLightsFixed = async (fixtureId: string) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ status: 'working' as LightStatus })
    .eq('id', fixtureId);
  
  if (error) throw error;
  return true;
};

export const toggleElectricianRequired = async (fixtureId: string, required: boolean) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ electrical_issues: required })
    .eq('id', fixtureId);
  
  if (error) throw error;
  return true;
};

export const assignFixturesToZone = async (fixtureIds: string[], zoneId: string) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ zone_id: zoneId })
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};