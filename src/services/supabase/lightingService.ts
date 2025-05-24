
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
      zone_name: null,
      building_name: null,
      floor_name: null,
      floor_id: fixture.floor_id || null,
      space_id: fixture.space_id || null,
      space_type: (fixture.space_type as 'room' | 'hallway') || 'room',
      position: (fixture.position as 'ceiling' | 'wall' | 'floor' | 'desk') || 'ceiling',
      sequence_number: fixture.sequence_number || null,
      zone_id: fixture.zone_id || null,
      space_name: null,
      room_number: fixture.room_number || null,
      technology: fixture.technology as string || null,
      maintenance_notes: fixture.maintenance_notes || null,
      created_at: fixture.created_at || null,
      updated_at: fixture.updated_at || null,
      bulb_count: fixture.bulb_count || 1,
      electrical_issues: parseElectricalIssues(fixture.electrical_issues),
      ballast_issue: fixture.ballast_issue || false,
      ballast_check_notes: fixture.ballast_check_notes || null,
      emergency_circuit: false,
      backup_power_source: null,
      emergency_duration_minutes: null,
      maintenance_history: parseMaintenanceHistory(fixture.maintenance_history),
      inspection_history: parseInspectionHistory(fixture.inspection_history)
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
      type: data.type,
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
