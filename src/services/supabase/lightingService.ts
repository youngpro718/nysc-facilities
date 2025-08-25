
import { supabase } from '@/integrations/supabase/client';
import { LightingFixture, LightStatus, LightingFixtureFormData, LightingZoneFormData, RoomLightingStats } from '@/types/lighting';

// Feature flags to optionally use database views if available
const USE_ENRICHED_LIGHTING_VIEW = true; // Always use enriched view for location data
const USE_ROOM_LIGHTING_STATS_VIEW = false; // Keep this disabled for now

// Compute durations in minutes for outage (open) and repair (closed)
function computeDurations(reported_out_date?: string | null, replaced_date?: string | null) {
  let outage_minutes: number | null = null;
  let repair_minutes: number | null = null;
  if (reported_out_date) {
    const start = new Date(reported_out_date).getTime();
    if (!Number.isNaN(start)) {
      if (replaced_date) {
        const end = new Date(replaced_date).getTime();
        if (!Number.isNaN(end) && end >= start) {
          repair_minutes = Math.floor((end - start) / 60000);
        }
      } else {
        const now = Date.now();
        if (now >= start) {
          outage_minutes = Math.floor((now - start) / 60000);
        }
      }
    }
  }
  return { outage_minutes, repair_minutes };
}

/**
 * Fetch all lighting fixtures with a simplified approach
 */
export async function fetchLightingFixtures(): Promise<LightingFixture[]> {
  try {
    // 1) Optionally try enriched view first to reduce client joins.
    if (USE_ENRICHED_LIGHTING_VIEW) {
      try {
        // Cast to any because the generated Database types may not include this view yet
        const { data: enriched, error: enrichedError } = await (supabase as any)
          .from('lighting_fixtures_enriched')
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
            room_number,
            space_name,
            building_name,
            floor_name,
            building_id,
            floor_id
          `);

        if (!enrichedError && enriched && enriched.length > 0) {
          return enriched.map((fixture: any): LightingFixture => ({
            id: fixture.id,
            name: fixture.name || '',
            type: mapFixtureType(fixture.type),
            status: (fixture.status as LightStatus) || 'functional',
            room_number: fixture.room_number || null,
            space_name: fixture.space_name || null,
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
            building_name: fixture.building_name || null,
            floor_name: fixture.floor_name || null,
            building_id: fixture.building_id || undefined,
            floor_id: fixture.floor_id || null,
            ...computeDurations(fixture.reported_out_date, fixture.replaced_date)
          }));
        }
      } catch (e) {
        // View might not exist yet; ignore and fall back
      }
    }

    // 2) Fallback: fetch base fixtures and stitch space data client-side
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

    if (!fixtures) return [];

    const spaceIds = Array.from(new Set((fixtures || [])
      .map((f: any) => f.space_id)
      .filter((id: string | null | undefined): id is string => !!id)));

    let spacesMap: Record<string, { id: string; name: string | null; room_number: string | null }> = {};
    let roomsMap: Record<string, { id: string; name: string | null; room_number: string | null }> = {};
    if (spaceIds.length > 0) {
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('id, name, room_number')
        .in('id', spaceIds);

      if (!spacesError && spaces) {
        spacesMap = spaces.reduce((acc: Record<string, { id: string; name: string | null; room_number: string | null }>, s: any) => {
          acc[s.id] = { id: s.id, name: s.name || null, room_number: s.room_number || null };
          return acc;
        }, {});
      }

      const missingIds = spaceIds.filter(id => !spacesMap[id]);
      if (missingIds.length > 0) {
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select('id, name, room_number')
          .in('id', missingIds);

        if (!roomsError && rooms) {
          roomsMap = rooms.reduce((acc: Record<string, { id: string; name: string | null; room_number: string | null }>, r: any) => {
            acc[r.id] = { id: r.id, name: r.name || null, room_number: r.room_number || null };
            return acc;
          }, {});
        }
      }
    }

    return fixtures.map((fixture): LightingFixture => ({
      id: fixture.id,
      name: fixture.name || '',
      type: mapFixtureType(fixture.type),
      status: (fixture.status as LightStatus) || 'functional',
      room_number: (spacesMap[fixture.space_id]?.room_number ?? roomsMap[fixture.space_id]?.room_number ?? fixture.room_number) || null,
      space_name: (spacesMap[fixture.space_id]?.name ?? roomsMap[fixture.space_id]?.name) ?? null,
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
      building_id: undefined,
      ...computeDurations(fixture.reported_out_date, fixture.replaced_date)
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
 * Report an outage for a fixture (sets reported_out_date and requires_electrician)
 */
export async function reportFixtureOutage(
  fixtureId: string,
  params: { requires_electrician: boolean; notes?: string }
) {
  const update: Record<string, any> = {
    reported_out_date: new Date().toISOString(),
    requires_electrician: params.requires_electrician,
  };
  if (params.notes) update.notes = params.notes;

  const { error } = await supabase
    .from('lighting_fixtures')
    .update(update)
    .eq('id', fixtureId);

  if (error) throw error;
  return true;
}

/**
 * Resolve an outage for a fixture (sets replaced_date and can clear ballast flag)
 */
export async function resolveFixtureOutage(
  fixtureId: string,
  params?: { clear_ballast_issue?: boolean; notes?: string }
) {
  const update: Record<string, any> = {
    replaced_date: new Date().toISOString(),
  };
  if (params?.clear_ballast_issue) update.ballast_issue = false;
  if (params?.notes) update.notes = params.notes;

  const { error } = await supabase
    .from('lighting_fixtures')
    .update(update)
    .eq('id', fixtureId);

  if (error) throw error;
  return true;
}

/**
 * Fetch per-room lighting stats from a SQL view
 */
export async function fetchRoomLightingStats(): Promise<RoomLightingStats[]> {
  // Skip querying the view unless explicitly enabled to avoid noisy 404s in dev
  if (!USE_ROOM_LIGHTING_STATS_VIEW) return [];

  try {
    // Using any for view since generated Database types may not include it
    const { data, error } = await (supabase as any)
      .from('room_lighting_stats_v')
      .select('*');

    if (error) throw error;
    return (data || []).map((r: any): RoomLightingStats => ({
      room_id: r.room_id ?? null,
      room_name: r.room_name ?? null,
      room_number: r.room_number ?? null,
      fixture_count: Number(r.fixture_count ?? 0),
      open_issues_total: Number(r.open_issues_total ?? 0),
      open_replaceable: Number(r.open_replaceable ?? 0),
      open_electrician: Number(r.open_electrician ?? 0),
      mttr_minutes: r.mttr_minutes !== null && r.mttr_minutes !== undefined ? Number(r.mttr_minutes) : null,
      longest_open_minutes: r.longest_open_minutes !== null && r.longest_open_minutes !== undefined ? Number(r.longest_open_minutes) : null,
      has_sla_breach: Boolean(r.has_sla_breach),
    }));
  } catch (e) {
    console.warn('room_lighting_stats_v not available; returning empty stats.');
    return [];
  }
}

/**
 * Fetch lighting zones
 */
export async function fetchLightingZones(buildingId?: string, floorId?: string) {
  let query = supabase.from('lighting_zones').select('id, name, type, floor_id');
  
  if (floorId && floorId !== 'all') {
    query = query.eq('floor_id', floorId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function fetchFloorsForZones() {
  const { data, error } = await supabase
    .from('floors')
    .select('id, name, floor_number, building_id')
    .order('floor_number');

  if (error) throw error;
  return data || [];
}

export async function assignFixturesToZone(fixtureIds: string[], zoneId: string) {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ zone_id: zoneId })
    .in('id', fixtureIds);

  if (error) throw error;
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
