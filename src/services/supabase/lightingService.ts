import { supabase } from '@/integrations/supabase/client';
import { LightingFixture, LightStatus, LightingFixtureFormData, LightingZoneFormData } from '@/types/lighting';

/**
 * Fetch all lighting fixtures with simplified queries to avoid deep type instantiation
 */
export async function fetchLightingFixtures() {
  // First, get the basic fixture data
  const { data: rawFixtures, error } = await supabase
    .from('lighting_fixtures')
    .select(`
      id,
      name,
      type,
      status,
      zone_id,
      space_id,
      space_type,
      position,
      sequence_number,
      technology,
      maintenance_notes,
      created_at,
      updated_at,
      bulb_count,
      electrical_issues,
      ballast_issue,
      ballast_check_notes,
      maintenance_history,
      inspection_history,
      floor_id,
      room_number
    `);

  if (error) throw error;

  if (!rawFixtures || rawFixtures.length === 0) {
    return [];
  }

  // Get space data separately to avoid deep nesting
  const spaceIds = rawFixtures.map(f => f.space_id).filter(Boolean) as string[];
  const spaceData: Record<string, any> = {};
  
  if (spaceIds.length > 0) {
    const { data: spaces } = await supabase
      .from('spaces')
      .select('id, name, room_number, floor_id')
      .in('id', spaceIds);

    if (spaces) {
      spaces.forEach(space => {
        spaceData[space.id] = space;
      });
    }
  }

  // Get floor data separately
  const floorIds = rawFixtures.map(f => f.floor_id).filter(Boolean) as string[];
  const floorData: Record<string, any> = {};
  
  if (floorIds.length > 0) {
    const { data: floors } = await supabase
      .from('floors')
      .select('id, name, building_id')
      .in('id', floorIds);

    if (floors) {
      floors.forEach(floor => {
        floorData[floor.id] = floor;
      });
    }
  }

  // Get building data separately
  const buildingIds = Object.values(floorData)
    .map((f: any) => f?.building_id)
    .filter(Boolean) as string[];
  const buildingData: Record<string, any> = {};
  
  if (buildingIds.length > 0) {
    const { data: buildings } = await supabase
      .from('buildings')
      .select('id, name')
      .in('id', buildingIds);

    if (buildings) {
      buildings.forEach(building => {
        buildingData[building.id] = building;
      });
    }
  }

  // Transform the data into the expected format
  const fixtures: LightingFixture[] = rawFixtures.map((raw): LightingFixture => {
    const space = raw.space_id ? spaceData[raw.space_id] : null;
    const floor = raw.floor_id ? floorData[raw.floor_id] : null;
    const building = floor?.building_id ? buildingData[floor.building_id] : null;
    
    return {
      id: raw.id,
      name: raw.name || '',
      type: mapFixtureType(raw.type as string),
      status: (raw.status as LightStatus) || 'functional',
      zone_name: null,
      building_name: building?.name || null,
      floor_name: floor?.name || null,
      floor_id: space?.floor_id || raw.floor_id || null,
      space_id: raw.space_id || null,
      space_type: ((raw.space_type as string) || 'room') as 'room' | 'hallway',
      position: ((raw.position as string) || 'ceiling') as 'ceiling' | 'wall' | 'floor' | 'desk',
      sequence_number: raw.sequence_number || null,
      zone_id: raw.zone_id || null,
      space_name: space?.name || null,
      room_number: space?.room_number || raw.room_number || null,
      technology: normalizeTechnology(raw.technology as string),
      maintenance_notes: raw.maintenance_notes || null,
      created_at: raw.created_at || null,
      updated_at: raw.updated_at || null,
      bulb_count: raw.bulb_count || 1,
      electrical_issues: parseElectricalIssues(raw.electrical_issues),
      ballast_issue: raw.ballast_issue || false,
      ballast_check_notes: raw.ballast_check_notes || null,
      emergency_circuit: false,
      backup_power_source: null,
      emergency_duration_minutes: null,
      maintenance_history: parseMaintenanceHistory(raw.maintenance_history),
      inspection_history: parseInspectionHistory(raw.inspection_history)
    };
  });

  return fixtures;
}

// Helper function to map fixture types safely
function mapFixtureType(type: string): 'standard' | 'emergency' | 'motion_sensor' {
  switch (type) {
    case 'emergency':
      return 'emergency';
    case 'motion_sensor':
      return 'motion_sensor';
    case 'decorative':
    case 'exit_sign':
    case 'standard':
    default:
      return 'standard';
  }
}

// Helper function to parse electrical issues
function parseElectricalIssues(issues: any) {
  if (typeof issues === 'object' && issues !== null) {
    return {
      short_circuit: issues.short_circuit || false,
      wiring_issues: issues.wiring_issues || false,
      voltage_problems: issues.voltage_problems || false
    };
  }
  return {
    short_circuit: false,
    wiring_issues: false,
    voltage_problems: false
  };
}

// Helper function to parse maintenance history
function parseMaintenanceHistory(history: any) {
  if (Array.isArray(history)) {
    return history.map(record => ({
      id: record.id || '',
      date: record.date || '',
      type: record.type || '',
      notes: record.notes || ''
    }));
  }
  return [];
}

// Helper function to parse inspection history
function parseInspectionHistory(history: any) {
  if (Array.isArray(history)) {
    return history.map(record => ({
      id: record.id || '',
      date: record.date || '',
      status: record.status || '',
      notes: record.notes || ''
    }));
  }
  return [];
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
    // Map form data to database schema with proper type handling
    const fixtureType = mapFixtureType(data.type);

    const insertData = {
      name: data.name,
      type: fixtureType,
      technology: data.technology,
      bulb_count: data.bulb_count,
      status: data.status,
      electrical_issues: JSON.stringify(data.electrical_issues),
      ballast_issue: data.ballast_issue,
      maintenance_notes: data.maintenance_notes,
      ballast_check_notes: data.ballast_check_notes,
      zone_id: data.zone_id || null,
      space_id: data.space_id,
      space_type: data.space_type,
      position: data.position,
      room_number: data.room_number
    };

    const { data: fixture, error: fixtureError } = await supabase
      .from('lighting_fixtures')
      .insert(insertData)
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
