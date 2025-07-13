
import { supabase } from '@/integrations/supabase/client';
import { LightingFixture, LightStatus, LightingFixtureFormData, LightingZoneFormData } from '@/types/lighting';

/**
 * Fetch all lighting fixtures with a simplified approach
 */
export async function fetchLightingFixtures(): Promise<LightingFixture[]> {
  try {
    // Get basic fixture data
    const { data: fixtures, error } = await supabase
      .from('lighting_fixtures')
      .select(`
        id,
        name,
        type,
        status,
        space_id,
        space_type,
        position,
        technology,
        created_at,
        updated_at,
        bulb_count,
        ballast_issue,
        requires_electrician,
        reported_out_date,
        replaced_date,
        notes,
        room_number
      `);

    if (error) {
      console.error('Error fetching lighting fixtures:', error);
      throw error;
    }

    if (!fixtures) {
      return [];
    }

    // Transform to expected format
    return fixtures.map((fixture): LightingFixture => ({
      id: fixture.id,
      name: fixture.name || '',
      type: mapFixtureType(fixture.type),
      status: (fixture.status as LightStatus) || 'functional',
      room_number: fixture.room_number || null,
      space_name: null,
      space_id: fixture.space_id || null,
      space_type: (fixture.space_type as 'room' | 'hallway') || 'room',
      position: (fixture.position as 'ceiling' | 'wall' | 'floor' | 'desk') || 'ceiling',
      technology: fixture.technology || null,
      bulb_count: fixture.bulb_count || 1,
      ballast_issue: fixture.ballast_issue || false,
      requires_electrician: fixture.requires_electrician || false,
      reported_out_date: fixture.reported_out_date || null,
      replaced_date: fixture.replaced_date || null,
      notes: fixture.notes || null,
      created_at: fixture.created_at || null,
      updated_at: fixture.updated_at || null,
      building_name: null,
      floor_name: null,
      building_id: undefined
    }));
  } catch (error) {
    console.error('Error in fetchLightingFixtures:', error);
    return [];
  }
}

// Helper function to map fixture types safely
function mapFixtureType(type: string): 'standard' | 'emergency' | 'motion_sensor' {
  switch (type) {
    case 'emergency':
      return 'emergency';
    case 'motion_sensor':
      return 'motion_sensor';
    default:
      return 'standard';
  }
}

// Helper function to map fixture types for database insert - ensuring proper enum values
function mapFixtureTypeForDatabase(type: string): 'standard' | 'emergency' | 'motion_sensor' {
  switch (type) {
    case 'emergency':
      return 'emergency';
    case 'motion_sensor':
      return 'motion_sensor';
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
    const insertData = {
      name: data.name,
      type: mapFixtureTypeForDatabase(data.type),
      technology: data.technology || null,
      bulb_count: data.bulb_count,
      status: data.status,
      ballast_issue: data.ballast_issue,
      requires_electrician: data.requires_electrician,
      space_id: data.space_id,
      space_type: data.space_type,
      position: data.position,
      room_number: data.room_number,
      notes: data.notes
    };

    const { data: fixture, error } = await supabase
      .from('lighting_fixtures')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

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

/**
 * Mark lights as out (reported)
 */
export async function markLightsOut(fixtureIds: string[], requiresElectrician: boolean = false) {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ 
      status: 'non_functional',
      reported_out_date: new Date().toISOString(),
      requires_electrician: requiresElectrician,
      replaced_date: null
    })
    .in('id', fixtureIds);

  if (error) throw error;
  return true;
}

/**
 * Mark lights as fixed (replaced)
 */
export async function markLightsFixed(fixtureIds: string[]) {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ 
      status: 'functional',
      replaced_date: new Date().toISOString(),
      requires_electrician: false
    })
    .in('id', fixtureIds);

  if (error) throw error;
  return true;
}

/**
 * Toggle electrician requirement
 */
export async function toggleElectricianRequired(fixtureIds: string[], requiresElectrician: boolean) {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ requires_electrician: requiresElectrician })
    .in('id', fixtureIds);

  if (error) throw error;
  return true;
}
