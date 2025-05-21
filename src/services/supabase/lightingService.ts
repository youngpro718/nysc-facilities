
import { supabase } from '@/integrations/supabase/client';
import { LightingFixture, LightStatus, LightingFixtureFormData, LightingZoneFormData } from '@/types/lighting';
import { Json } from '@/types/supabase';

/**
 * Fetch all lighting fixtures
 */
export async function fetchLightingFixtures() {
  const { data: rawFixtures, error } = await supabase
    .from('lighting_fixtures')
    .select(`
      *,
      floor_id,
      room_number,
      spaces!space_id (
        name,
        room_number,
        floor_id,
        floors!floor_id (
          name,
          building_id,
          buildings!building_id (
            name
          )
        )
      )
    `);

  if (error) throw error;

  return (rawFixtures || []).map((raw): LightingFixture => ({
    id: raw.id,
    name: raw.name || '',
    type: raw.type || 'standard',
    status: raw.status || 'functional',
    zone_name: null,
    building_name: raw.spaces?.floors?.buildings?.name || null,
    floor_name: raw.spaces?.floors?.name || null,
    floor_id: raw.spaces?.floor_id || null,
    space_id: raw.space_id || null,
    space_type: (raw.space_type || 'room') as 'room' | 'hallway',
    position: (raw.position || 'ceiling') as 'ceiling' | 'wall' | 'floor' | 'desk',
    sequence_number: raw.sequence_number || null,
    zone_id: raw.zone_id || null,
    space_name: raw.spaces?.name || null,
    room_number: raw.spaces?.room_number || null,
    technology: normalizeTechnology(raw.technology),
    maintenance_notes: raw.maintenance_notes || null,
    created_at: raw.created_at || null,
    updated_at: raw.updated_at || null,
    bulb_count: raw.bulb_count || 1,
    electrical_issues: typeof raw.electrical_issues === 'object' ? {
      short_circuit: (raw.electrical_issues as any)?.short_circuit || false,
      wiring_issues: (raw.electrical_issues as any)?.wiring_issues || false,
      voltage_problems: (raw.electrical_issues as any)?.voltage_problems || false
    } : {
      short_circuit: false,
      wiring_issues: false,
      voltage_problems: false
    },
    ballast_issue: raw.ballast_issue || false,
    ballast_check_notes: raw.ballast_check_notes || null,
    emergency_circuit: false,
    backup_power_source: null,
    emergency_duration_minutes: null,
    maintenance_history: Array.isArray(raw.maintenance_history) 
      ? (raw.maintenance_history as any[]).map(record => ({
          id: record.id || '',
          date: record.date || '',
          type: record.type || '',
          notes: record.notes || ''
        }))
      : [],
    inspection_history: Array.isArray(raw.inspection_history)
      ? (raw.inspection_history as any[]).map(record => ({
          id: record.id || '',
          date: record.date || '',
          status: record.status || '',
          notes: record.notes || ''
        }))
      : []
  }));
}

// Helper function to normalize technology values
function normalizeTechnology(tech: string | null) {
  if (!tech) return null;
  
  switch(tech.toLowerCase()) {
    case 'led': return 'LED';
    case 'fluorescent': return 'Fluorescent';
    case 'bulb':
    case 'incandescent':
    case 'halogen':
    case 'metal_halide':
      return 'Bulb';
    default:
      return null;
  }
}

/**
 * Delete a lighting fixture
 */
export async function deleteLightingFixture(id: string) {
  const { error } = await supabase
    .from('lighting_fixtures')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Delete multiple lighting fixtures
 */
export async function deleteLightingFixtures(fixtureIds: string[]) {
  const { error } = await supabase
    .from('lighting_fixtures')
    .delete()
    .in('id', fixtureIds);

  if (error) throw error;
  return true;
}

/**
 * Update lighting fixture status
 */
export async function updateLightingFixturesStatus(fixtureIds: string[], status: LightStatus) {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ status })
    .in('id', fixtureIds);

  if (error) throw error;
  return true;
}

/**
 * Fetch lighting zones
 */
export async function fetchLightingZones(buildingId?: string, floorId?: string) {
  let query = supabase.from('lighting_zones').select('id, name');
  
  if (floorId && floorId !== 'all') {
    query = query.eq('floor_id', floorId);
  }
  
  if (buildingId && buildingId !== 'all') {
    query = query.eq('building_id', buildingId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return (data || []).map(zone => ({ 
    label: zone.name, 
    value: zone.id 
  }));
}

/**
 * Create a new lighting fixture
 */
export async function createLightingFixture(data: LightingFixtureFormData) {
  try {
    // Fix the type issues by using a properly typed object
    const fixtureData = {
      name: data.name,
      type: data.type,
      technology: data.technology,
      bulb_count: data.bulb_count,
      status: data.status,
      electrical_issues: data.electrical_issues,
      ballast_issue: data.ballast_issue,
      maintenance_notes: data.maintenance_notes,
      ballast_check_notes: data.ballast_check_notes,
      zone_id: data.zone_id || null,
      space_id: data.space_id,
      space_type: data.space_type,
      position: data.position,
      room_number: data.room_number
    };

    // Insert into the database with proper type casting
    const { data: fixture, error: fixtureError } = await supabase
      .from('lighting_fixtures')
      .insert(fixtureData)
      .select()
      .single();

    if (fixtureError) throw fixtureError;

    // Get the next sequence number for this space
    const { data: sequenceData, error: sequenceError } = await supabase
      .rpc('get_next_lighting_sequence', {
        p_space_id: data.space_id
      });

    if (sequenceError) throw sequenceError;

    // Then create the spatial assignment
    const { error: assignmentError } = await supabase
      .from('spatial_assignments')
      .insert({
        fixture_id: fixture.id,
        space_id: data.space_id,
        space_type: data.space_type,
        position: data.position,
        sequence_number: sequenceData
      });

    if (assignmentError) throw assignmentError;

    return fixture;
  } catch (error) {
    console.error("Error in createLightingFixture:", error);
    throw error;
  }
}

/**
 * Create a new lighting zone
 */
export async function createLightingZone(data: LightingZoneFormData) {
  const { error } = await supabase
    .from('lighting_zones')
    .insert({
      name: data.name,
      type: data.type,
      floor_id: data.floorId,
    });

  if (error) throw error;
  return true;
}
