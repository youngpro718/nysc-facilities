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

export const markLightsOut = async (fixtureIds: string[], requiresElectrician: boolean = false) => {
  const updateData: any = { 
    status: 'out' as LightStatus,
    reported_out_date: new Date().toISOString()
  };
  
  if (requiresElectrician) {
    updateData.requires_electrician = true;
    updateData.electrical_issues = true;
  }

  const { error } = await supabase
    .from('lighting_fixtures')
    .update(updateData)
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

export const markLightsFixed = async (fixtureIds: string[]) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ 
      status: 'working' as LightStatus,
      replaced_date: new Date().toISOString(),
      requires_electrician: false,
      electrical_issues: false
    })
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

export const toggleElectricianRequired = async (fixtureIds: string[], required: boolean) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ 
      requires_electrician: required,
      electrical_issues: required 
    })
    .in('id', fixtureIds);
  
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