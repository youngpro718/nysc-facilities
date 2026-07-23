import { supabase } from '@/lib/supabase';

export type LightingIssueType =
  | 'out'
  | 'flickering'
  | 'dim'
  | 'buzzing'
  | 'damaged'
  | 'other';

export type LightingIssuePriority = 'low' | 'medium' | 'high';
export type LightingIssueStatus = 'open' | 'in_progress' | 'resolved';

export type LightingBulbType = 'led' | 'fluorescent' | 'screw_in' | 'unknown';
export type LightingCeilingAccess = 'normal' | 'high' | 'hard_to_reach' | 'unknown';

export interface LightingIssueInput {
  issue_type: LightingIssueType;
  priority: LightingIssuePriority;
  description: string;
  room_id?: string | null;
  location_description?: string | null;
  fixture_id?: string | null;
  bulb_type?: LightingBulbType;
  ceiling_access?: LightingCeilingAccess;
}

export interface LightingIssueRecord {
  id: string;
  fixture_id: string | null;
  issue_type: string;
  priority: string;
  status: string;
  description: string;
  reported_by: string | null;
  room_id: string | null;
  location_description: string | null;
  assigned_to: string | null;
  resolution_notes: string | null;
  reported_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  bulb_type?: string | null;
  ceiling_access?: string | null;
}

export interface StaffLightingIssue extends LightingIssueRecord {
  reporter?: { first_name: string | null; last_name: string | null; email: string } | null;
  room?: { room_number: string | null; name: string | null } | null;
  fixture?: { name: string | null } | null;
}

/**
 * File a lighting issue. RLS lets the row exist with reported_by=auth.uid().
 */
export async function submitLightingIssue(input: LightingIssueInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { error } = await supabase.from('lighting_issues').insert({
    issue_type: input.issue_type,
    priority: input.priority,
    description: input.description.trim(),
    status: 'open',
    reported_by: user.id,
    room_id: input.room_id ?? null,
    location_description: input.location_description?.trim() || null,
    fixture_id: input.fixture_id ?? null,
    bulb_type: input.bulb_type ?? 'unknown',
    ceiling_access: input.ceiling_access ?? 'unknown',
  });
  if (error) throw error;
}

export async function listLightingIssuesForStaff(): Promise<StaffLightingIssue[]> {
  const { data, error } = await supabase
    .from('lighting_issues')
    .select(`
      id, fixture_id, issue_type, priority, status, description,
      reported_by, room_id, location_description, assigned_to,
      resolution_notes, reported_at, resolved_at, created_at, updated_at,
      bulb_type, ceiling_access,
      reporter:profiles!reported_by(first_name, last_name, email),
      room:rooms(room_number, name),
      fixture:lighting_fixtures(name)
    `)
    .order('reported_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StaffLightingIssue[];
}

/**
 * Count prior reports in this room within the last `windowDays` days
 * (excluding the issue with `excludeId`, when provided). Used to surface
 * recurring trouble spots in the FC queue.
 */
export async function countPriorReportsInRoom(
  roomId: string,
  excludeId?: string,
  windowDays = 90,
): Promise<number> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  let q = supabase
    .from('lighting_issues')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .gte('reported_at', since);
  if (excludeId) q = q.neq('id', excludeId);
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

export async function updateLightingIssueStatus(
  id: string,
  status: LightingIssueStatus,
  options?: { resolutionNotes?: string; fixtureId?: string | null },
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString();
    if (options?.resolutionNotes) updates.resolution_notes = options.resolutionNotes;
  }
  const { error } = await supabase.from('lighting_issues').update(updates).eq('id', id);
  if (error) throw error;

  // Resolving an issue means the fixture it pointed to is working again.
  // Keep the fixture table's status in sync so it doesn't keep showing as
  // broken after the report that flagged it has been closed out.
  if (status === 'resolved' && options?.fixtureId) {
    const { error: fixtureError } = await supabase
      .from('lighting_fixtures')
      .update({ status: 'functional', updated_at: new Date().toISOString() })
      .eq('id', options.fixtureId);
    if (fixtureError) {
      console.error('Failed to sync fixture status after resolving issue:', fixtureError);
    }
  }
}
