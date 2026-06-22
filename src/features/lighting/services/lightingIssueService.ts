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

export interface LightingIssueInput {
  issue_type: LightingIssueType;
  priority: LightingIssuePriority;
  description: string;
  room_id?: string | null;
  location_description?: string | null;
  fixture_id?: string | null;
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
}

export interface StaffLightingIssue extends LightingIssueRecord {
  reporter?: { first_name: string | null; last_name: string | null; email: string } | null;
  room?: { room_number: string | null; name: string | null } | null;
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
      reporter:profiles!reported_by(first_name, last_name, email),
      room:rooms(room_number, name)
    `)
    .order('reported_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StaffLightingIssue[];
}

export async function updateLightingIssueStatus(
  id: string,
  status: LightingIssueStatus,
  options?: { resolutionNotes?: string },
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
}
