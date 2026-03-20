import { db } from '@/services/core/supabaseClient';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export type LightStatus = 'functional' | 'non_functional' | 'maintenance_needed' | 'scheduled_replacement' | 'pending_maintenance';
export type LightingType = 'standard' | 'emergency' | 'exit_sign' | 'decorative' | 'motion_sensor';
export type LightingTechnology = 'LED' | 'Fluorescent' | 'Bulb';
export type LightingPosition = 'ceiling' | 'wall' | 'floor' | 'desk';
export type FixtureScanAction = 'functional' | 'bulb_out' | 'ballast_issue' | 'flickering' | 'power_issue' | 'skip';
export type WalkthroughStatus = 'in_progress' | 'completed' | 'cancelled';

export interface LightingFixture {
  id: string;
  name: string;
  type: LightingType;
  status: LightStatus;
  technology?: LightingTechnology;
  position: LightingPosition;
  bulb_count: number;
  space_id?: string;
  space_type?: string;
  room_number?: string;
  building_id?: string;
  floor_id?: string;
  zone_id?: string;
  electrical_issues?: Record<string, unknown>;
  ballast_issue: boolean;
  requires_electrician: boolean;
  reported_out_date?: string;
  replaced_date?: string;
  notes?: string;
  ballast_check_notes?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  installation_date?: string;
  emergency_circuit: boolean;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export interface LightingIssue {
  id: string;
  fixture_id: string;
  issue_type: string;
  priority: string;
  status: string;
  reported_at: string;
  resolved_at?: string;
  description?: string;
  assigned_to?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WalkthroughSession {
  id: string;
  hallway_id?: string;
  floor_id?: string;
  started_by?: string;
  started_at: string;
  completed_at?: string;
  total_fixtures: number;
  fixtures_checked: number;
  issues_found: number;
  ballast_issues_found: number;
  notes?: string;
  status: WalkthroughStatus;
}

export interface FixtureScan {
  id: string;
  fixture_id: string;
  scanned_by?: string;
  scanned_at: string;
  action_taken?: FixtureScanAction;
  scan_location?: string;
  device_info?: Record<string, unknown>;
}

export interface CreateFixturePayload {
  name: string;
  type: LightingType;
  status?: LightStatus;
  technology?: LightingTechnology;
  position?: LightingPosition;
  bulb_count?: number;
  space_id?: string;
  space_type?: string;
  room_number?: string;
  building_id?: string;
  floor_id?: string;
  zone_id?: string;
  ballast_issue?: boolean;
  requires_electrician?: boolean;
  notes?: string;
  emergency_circuit?: boolean;
}

export interface UpdateFixtureStatusPayload {
  status: LightStatus;
  notes?: string;
  ballast_issue?: boolean;
  requires_electrician?: boolean;
  resolved_at?: string;
}

export interface StartWalkthroughPayload {
  floor_id: string;
  hallway_id?: string;
  started_by: string;
}

export interface RecordFixtureScanPayload {
  walkthrough_id: string;
  fixture_id: string;
  action_taken: FixtureScanAction;
  scanned_by: string;
  scan_location?: string;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get all fixtures for a specific space (room or hallway)
 */
export async function getFixturesForSpace(spaceId: string, spaceType: 'room' | 'hallway') {
  try {
    const { data, error } = await db
      .from('lighting_fixtures')
      .select('*')
      .eq('space_id', spaceId)
      .eq('space_type', spaceType)
      .order('name');

    if (error) throw error;
    return data as LightingFixture[];
  } catch (error) {
    logger.error('Error fetching fixtures for space:', error);
    throw error;
  }
}

/**
 * Get all fixtures for a floor (used for walkthrough setup)
 */
export async function getFixturesForFloor(floorId: string) {
  try {
    const { data, error } = await db
      .from('lighting_fixtures')
      .select('*')
      .eq('floor_id', floorId)
      .order('room_number', { ascending: true });

    if (error) throw error;
    return data as LightingFixture[];
  } catch (error) {
    logger.error('Error fetching fixtures for floor:', error);
    throw error;
  }
}

/**
 * Get fixtures filtered by status, optionally scoped to a building
 */
export async function getFixturesByStatus(buildingId?: string, status?: LightStatus) {
  try {
    let query = db.from('lighting_fixtures').select('*');

    if (buildingId) {
      query = query.eq('building_id', buildingId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data as LightingFixture[];
  } catch (error) {
    logger.error('Error fetching fixtures by status:', error);
    throw error;
  }
}

/**
 * Get all non-functional fixtures with issue details (for Operations lighting queue)
 */
export async function getOpenLightingIssues(buildingId?: string) {
  try {
    let query = db
      .from('lighting_fixtures')
      .select('*')
      .neq('status', 'functional');

    if (buildingId) {
      query = query.eq('building_id', buildingId);
    }

    query = query.order('emergency_circuit', { ascending: false })
      .order('requires_electrician', { ascending: false })
      .order('reported_out_date', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data as LightingFixture[];
  } catch (error) {
    logger.error('Error fetching open lighting issues:', error);
    throw error;
  }
}

/**
 * Get walkthrough history for a hallway
 */
export async function getWalkthroughHistory(hallwayId: string, limit = 10) {
  try {
    const { data, error } = await db
      .from('walkthrough_sessions')
      .select('*')
      .eq('hallway_id', hallwayId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as WalkthroughSession[];
  } catch (error) {
    logger.error('Error fetching walkthrough history:', error);
    throw error;
  }
}

/**
 * Start a new walkthrough session
 */
export async function startWalkthrough(payload: StartWalkthroughPayload) {
  try {
    // Count fixtures in the hallway/floor
    let fixtureQuery = db.from('lighting_fixtures').select('id', { count: 'exact', head: true });

    if (payload.hallway_id) {
      fixtureQuery = fixtureQuery.eq('space_id', payload.hallway_id).eq('space_type', 'hallway');
    } else {
      fixtureQuery = fixtureQuery.eq('floor_id', payload.floor_id);
    }

    const { count } = await fixtureQuery;

    const { data, error } = await db
      .from('walkthrough_sessions')
      .insert({
        floor_id: payload.floor_id,
        hallway_id: payload.hallway_id,
        started_by: payload.started_by,
        total_fixtures: count || 0,
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) throw error;
    return data as WalkthroughSession;
  } catch (error) {
    logger.error('Error starting walkthrough:', error);
    throw error;
  }
}

/**
 * Record a fixture scan during walkthrough
 */
export async function recordFixtureScan(payload: RecordFixtureScanPayload) {
  try {
    // Insert scan record
    const { error: scanError } = await db.from('fixture_scans').insert({
      fixture_id: payload.fixture_id,
      scanned_by: payload.scanned_by,
      action_taken: payload.action_taken,
      scan_location: payload.scan_location,
    });

    if (scanError) throw scanError;

    // Update fixture status based on action
    let newStatus: LightStatus = 'functional';
    let requiresElectrician = false;
    let ballastIssue = false;

    switch (payload.action_taken) {
      case 'bulb_out':
        newStatus = 'non_functional';
        break;
      case 'ballast_issue':
        newStatus = 'non_functional';
        ballastIssue = true;
        requiresElectrician = true;
        break;
      case 'flickering':
        newStatus = 'maintenance_needed';
        break;
      case 'power_issue':
        newStatus = 'non_functional';
        requiresElectrician = true;
        break;
      case 'functional':
        newStatus = 'functional';
        break;
      case 'skip':
        // Don't update status for skipped fixtures
        return;
    }

    // First get current scan_count
    const { data: currentFixture } = await db
      .from('lighting_fixtures')
      .select('scan_count')
      .eq('id', payload.fixture_id)
      .single();

    const { error: updateError } = await db
      .from('lighting_fixtures')
      .update({
        status: newStatus,
        ballast_issue: ballastIssue,
        requires_electrician: requiresElectrician,
        reported_out_date: newStatus !== 'functional' ? new Date().toISOString() : null,
        scan_count: (currentFixture?.scan_count || 0) + 1,
      })
      .eq('id', payload.fixture_id);

    if (updateError) throw updateError;

    // Update walkthrough session counters
    const { data: session } = await db
      .from('walkthrough_sessions')
      .select('fixtures_checked, issues_found, ballast_issues_found')
      .eq('id', payload.walkthrough_id)
      .single();

    const incrementFields: Record<string, number> = {
      fixtures_checked: (session?.fixtures_checked || 0) + 1,
    };

    if (newStatus !== 'functional') {
      incrementFields.issues_found = (session?.issues_found || 0) + 1;
    }

    if (ballastIssue) {
      incrementFields.ballast_issues_found = (session?.ballast_issues_found || 0) + 1;
    }

    const { error: sessionError } = await db
      .from('walkthrough_sessions')
      .update(incrementFields)
      .eq('id', payload.walkthrough_id);

    if (sessionError) throw sessionError;
  } catch (error) {
    logger.error('Error recording fixture scan:', error);
    throw error;
  }
}

/**
 * Complete a walkthrough session
 */
export async function completeWalkthrough(walkthroughId: string) {
  try {
    const { data, error } = await db
      .from('walkthrough_sessions')
      .update({
        completed_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', walkthroughId)
      .select()
      .single();

    if (error) throw error;
    return data as WalkthroughSession;
  } catch (error) {
    logger.error('Error completing walkthrough:', error);
    throw error;
  }
}

/**
 * Update fixture status (admin/facilities_manager direct update)
 */
export async function updateFixtureStatus(fixtureId: string, payload: UpdateFixtureStatusPayload) {
  try {
    const updateData: Partial<LightingFixture> = {
      status: payload.status,
      notes: payload.notes,
      ballast_issue: payload.ballast_issue ?? false,
      requires_electrician: payload.requires_electrician ?? false,
    };

    if (payload.status === 'functional' && payload.resolved_at) {
      updateData.replaced_date = payload.resolved_at;
      updateData.reported_out_date = undefined;
    }

    const { data, error } = await db
      .from('lighting_fixtures')
      .update(updateData)
      .eq('id', fixtureId)
      .select()
      .single();

    if (error) throw error;
    return data as LightingFixture;
  } catch (error) {
    logger.error('Error updating fixture status:', error);
    throw error;
  }
}

/**
 * Create a new fixture
 */
export async function createFixture(payload: CreateFixturePayload) {
  try {
    const { data, error } = await db
      .from('lighting_fixtures')
      .insert({
        name: payload.name,
        type: payload.type,
        status: payload.status || 'functional',
        technology: payload.technology,
        position: payload.position || 'ceiling',
        bulb_count: payload.bulb_count || 1,
        space_id: payload.space_id,
        space_type: payload.space_type,
        room_number: payload.room_number,
        building_id: payload.building_id,
        floor_id: payload.floor_id,
        zone_id: payload.zone_id,
        ballast_issue: payload.ballast_issue || false,
        requires_electrician: payload.requires_electrician || false,
        notes: payload.notes,
        emergency_circuit: payload.emergency_circuit || false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as LightingFixture;
  } catch (error) {
    logger.error('Error creating fixture:', error);
    throw error;
  }
}

/**
 * Get a single walkthrough session by ID
 */
export async function getWalkthroughSession(sessionId: string) {
  try {
    const { data, error } = await db
      .from('walkthrough_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data as WalkthroughSession;
  } catch (error) {
    logger.error('Error fetching walkthrough session:', error);
    throw error;
  }
}
