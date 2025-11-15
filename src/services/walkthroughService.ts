import { supabase } from '@/lib/supabase';
import { WalkthroughSession, QuickAction } from '@/types/walkthrough';
import { LightStatus } from '@/types/lighting';

export async function startWalkthrough(
  hallwayId: string,
  floorId: string
): Promise<WalkthroughSession> {
  const { data: fixtures, error: fixturesError } = await supabase
    .from('lighting_fixtures')
    .select('id')
    .eq('space_id', hallwayId)
    .eq('space_type', 'hallway')
    .order('sequence_number');

  if (fixturesError) throw fixturesError;

  const { data, error } = await supabase
    .from('walkthrough_sessions')
    .insert({
      hallway_id: hallwayId,
      floor_id: floorId,
      started_by: (await supabase.auth.getUser()).data.user?.id,
      total_fixtures: fixtures?.length || 0,
      fixtures_checked: 0,
      issues_found: 0,
      ballast_issues_found: 0,
      status: 'in_progress'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWalkthroughProgress(
  sessionId: string,
  fixturesChecked: number,
  issuesFound: number,
  ballastIssues: number
): Promise<void> {
  const { error } = await supabase
    .from('walkthrough_sessions')
    .update({
      fixtures_checked: fixturesChecked,
      issues_found: issuesFound,
      ballast_issues_found: ballastIssues
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function completeWalkthrough(
  sessionId: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('walkthrough_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function performQuickAction(
  fixtureId: string,
  action: QuickAction,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get current fixture state
    const { data: fixture, error: fetchError } = await supabase
      .from('lighting_fixtures')
      .select('status, ballast_issue')
      .eq('id', fixtureId)
      .single();

    if (fetchError) throw fetchError;

    let updateData: any = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'mark_out':
        updateData = {
          ...updateData,
          status: 'non_functional',
          reported_out_date: new Date().toISOString(),
          ballast_issue: false
        };
        if (notes) updateData.notes = notes;
        break;

      case 'ballast_issue':
        if (fixture?.status !== 'non_functional') {
          return {
            success: false,
            message: 'Mark light as OUT first, then flag ballast issue'
          };
        }
        updateData = {
          ...updateData,
          ballast_issue: true,
          requires_electrician: true
        };
        if (notes) updateData.notes = notes;
        break;

      case 'maintenance_needed':
        updateData = {
          ...updateData,
          status: 'maintenance_needed'
        };
        if (notes) updateData.notes = notes;
        break;

      case 'mark_functional':
        updateData = {
          ...updateData,
          status: 'functional',
          reported_out_date: null,
          replaced_date: null,
          ballast_issue: false,
          requires_electrician: false
        };
        break;

      case 'skip':
        // Just record the scan
        break;
    }

    // Update fixture
    if (action !== 'skip') {
      const { error: updateError } = await supabase
        .from('lighting_fixtures')
        .update(updateData)
        .eq('id', fixtureId);

      if (updateError) throw updateError;
    }

    // Record scan
    const { error: scanError } = await supabase
      .from('fixture_scans')
      .insert({
        fixture_id: fixtureId,
        scanned_by: (await supabase.auth.getUser()).data.user?.id,
        action_taken: action,
        device_info: {
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });

    if (scanError) throw scanError;

    // Update scan count
    await supabase.rpc('increment_scan_count', { fixture_id: fixtureId });

    return {
      success: true,
      message: getActionMessage(action)
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to perform action'
    };
  }
}

function getActionMessage(action: QuickAction): string {
  switch (action) {
    case 'mark_out':
      return 'Marked as non-functional';
    case 'ballast_issue':
      return 'Flagged ballast issue - electrician required';
    case 'maintenance_needed':
      return 'Marked for maintenance';
    case 'mark_functional':
      return 'Marked as functional';
    case 'skip':
      return 'Skipped';
    default:
      return 'Action completed';
  }
}

export async function getHallwayFixtures(hallwayId: string) {
  // Fetch fixtures
  const { data: fixtures, error: fixturesError } = await supabase
    .from('lighting_fixtures')
    .select('*')
    .eq('space_id', hallwayId)
    .eq('space_type', 'hallway')
    .order('sequence_number');

  if (fixturesError) throw fixturesError;

  // Fetch hallway details separately
  const { data: hallway, error: hallwayError } = await supabase
    .from('hallways')
    .select('name, code, floor_id')
    .eq('id', hallwayId)
    .maybeSingle();

  if (hallwayError) throw hallwayError;

  // Combine data
  return (fixtures || []).map(fixture => ({
    ...fixture,
    hallways: hallway
  }));
}

export async function getWalkthroughHistory(hallwayId?: string, limit = 10) {
  let query = supabase
    .from('walkthrough_sessions')
    .select(`
      *,
      hallways(name, code),
      profiles(first_name, last_name, email)
    `)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (hallwayId) {
    query = query.eq('hallway_id', hallwayId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
