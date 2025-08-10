import { supabase } from '@/integrations/supabase/client';
import { LightingIssue, LightingIssueStatus } from '@/types/lightingIssue';

export interface LightingIssueCreateData {
  fixture_id: string;
  location: string;
  bulb_type: string;
  form_factor?: string;
  issue_type: 'blown_bulb' | 'ballast_issue' | 'other';
  notes?: string;
  reported_by: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface LightingIssueUpdateData {
  status?: LightingIssueStatus;
  notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface LightingIssueWithDetails extends LightingIssue {
  fixture_name: string;
  room_number: string;
  floor_name: string;
  building_name: string;
  reported_by_name: string;
  assigned_to_name?: string;
  issue_id: string;
}

/**
 * Create a new lighting issue and link it to the main issues system
 */
export async function createLightingIssue(data: LightingIssueCreateData): Promise<{
  lightingIssue: any;
  mainIssue: any;
}> {
  try {
    // First, get the fixture details
    const { data: fixture, error: fixtureError } = await supabase
      .from('lighting_fixtures')
      .select('id, name, room_id, room_number')
      .eq('id', data.fixture_id)
      .single();

    if (fixtureError) throw fixtureError;

    // Create a lighting issue entry
    const { data: lightingIssue, error: lightingError } = await supabase
      .from('lighting_issues')
      .insert({
        location: data.location,
        bulb_type: data.bulb_type,
        form_factor: data.form_factor,
        issue_type: data.issue_type,
        status: 'open',
        notes: data.notes,
        reported_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (lightingError) throw lightingError;

    // Create a corresponding entry in the main issues table
    const issueTitle = `Lighting Issue: ${data.issue_type.replace('_', ' ')} - ${data.location}`;
    const { data: mainIssue, error: mainError } = await supabase
      .from('issues')
      .insert({
        title: issueTitle,
        issue_type: 'lighting',
        description: `${data.issue_type.replace('_', ' ')} reported at ${data.location}. Bulb type: ${data.bulb_type}. ${data.notes || ''}`,
        location_description: data.location,
        status: 'open',
        priority: (data.priority === 'critical' ? 'high' : (data.priority || 'medium')) as any,
        reported_by: data.reported_by,
        created_by: data.reported_by,
        tags: ['lighting', data.issue_type],
        room_id: fixture?.room_id ?? null
      } as any)
      .select()
      .single();

    if (mainError) throw mainError;

    // Update the lighting fixture status to indicate there's an issue
    await supabase
      .from('lighting_fixtures')
      .update({ 
        status: 'non_functional',
        reported_out_date: new Date().toISOString()
      })
      .eq('id', data.fixture_id);

    // Update the lighting issue with the main issue ID and fixture ID
    await supabase
      .from('lighting_issues')
      .update({ 
        issue_id: mainIssue.id,
        fixture_id: data.fixture_id
      })
      .eq('id', lightingIssue.id);

    return { lightingIssue, mainIssue };
  } catch (error) {
    console.error('Error creating lighting issue:', error);
    throw error;
  }
}

/**
 * Get all lighting issues with detailed information
 */
export async function getLightingIssuesWithDetails(): Promise<LightingIssueWithDetails[]> {
  try {
    // Get lighting issues with fixture details
    const { data: lightingIssues, error: issuesError } = await supabase
      .from('lighting_issues')
      .select('*')
      .order('reported_at', { ascending: false });

    if (issuesError) throw issuesError;

    // Get main issues that are lighting-related
    const { data: mainIssues, error: mainError } = await supabase
      .from('issues')
      .select('id, location_description, tags, status, description, created_at, resolved_at')
      .eq('issue_type', 'lighting')
      .order('created_at', { ascending: false });

    if (mainError) throw mainError;

    return (mainIssues || []).map((issue: any) => ({
      id: issue.id,
      location: issue.location_description,
      bulb_type: (issue.tags || []).find((tag: string) => 
        ['blown_bulb', 'ballast_issue', 'other'].includes(tag)
      ) || 'other',
      form_factor: (issue.tags || []).find((tag: string) => 
        tag.includes('form_factor')
      )?.replace('form_factor_', '') || undefined,
      issue_type: (issue.tags || []).find((tag: string) => 
        ['blown_bulb', 'ballast_issue', 'other'].includes(tag)
      ) || 'other',
      status: issue.status as LightingIssueStatus,
      notes: issue.description,
      reported_at: issue.created_at,
      resolved_at: issue.resolved_at,
      fixture_name: 'Unknown',
      room_number: 'Unknown',
      floor_name: 'Unknown',
      building_name: 'Unknown',
      reported_by_name: 'Unknown',
      issue_id: issue.id,
    }));
  } catch (error) {
    console.error('Error fetching lighting issues:', error);
    return [];
  }
}

/**
 * Get lighting issues by status
 */
export async function getLightingIssuesByStatus(
  status: LightingIssueStatus
): Promise<LightingIssueWithDetails[]> {
  try {
    const normalized = (status === 'deferred' ? 'open' : status) as 'open' | 'in_progress' | 'resolved';
    const { data: mainIssues, error } = await supabase
      .from('issues')
      .select('id, location_description, tags, status, description, created_at, resolved_at')
      .eq('issue_type', 'lighting')
      .eq('status', normalized)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (mainIssues || []).map((issue: any) => ({
      id: issue.id,
      location: issue.location_description,
      bulb_type: (issue.tags || []).find((tag: string) => 
        ['blown_bulb', 'ballast_issue', 'other'].includes(tag)
      ) || 'other',
      form_factor: (issue.tags || []).find((tag: string) => 
        tag.includes('form_factor')
      )?.replace('form_factor_', '') || undefined,
      issue_type: (issue.tags || []).find((tag: string) => 
        ['blown_bulb', 'ballast_issue', 'other'].includes(tag)
      ) || 'other',
      status: issue.status as LightingIssueStatus,
      notes: issue.description,
      reported_at: issue.created_at,
      resolved_at: issue.resolved_at,
      fixture_name: 'Unknown',
      room_number: 'Unknown',
      floor_name: 'Unknown',
      building_name: 'Unknown',
      reported_by_name: 'Unknown',
      issue_id: issue.id,
    }));
  } catch (error) {
    console.error('Error fetching lighting issues by status:', error);
    return [];
  }
}

/**
 * Update a lighting issue (through the main issues table)
 */
export async function updateLightingIssue(
  issueId: string, 
  data: LightingIssueUpdateData
): Promise<any> {
  try {
    const updateData: any = {};
    
    if (data.status) updateData.status = data.status;
    if (data.notes) updateData.description = data.notes;
    if (data.resolved_at) updateData.resolved_at = data.resolved_at;
    if (data.resolved_by) updateData.resolved_by = data.resolved_by;
    if (data.priority) updateData.priority = data.priority;

    const { data: updatedIssue, error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', issueId)
      .select()
      .single();

    if (error) throw error;


    return updatedIssue;
  } catch (error) {
    console.error('Error updating lighting issue:', error);
    throw error;
  }
}

/**
 * Get lighting issue statistics
 */
export async function getLightingIssueStats(): Promise<{
  total: number;
  open: number;
  deferred: number;
  resolved: number;
  byType: Record<string, number>;
}> {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('status, tags')
      .eq('issue_type', 'lighting');

    if (error) throw error;

    const stats = {
      total: data.length,
      open: 0,
      deferred: 0,
      resolved: 0,
      byType: {} as Record<string, number>
    };

    data.forEach(issue => {
      stats[issue.status]++;
      
      const typeTag = (issue.tags || []).find((tag: string) => 
        ['blown_bulb', 'ballast_issue', 'other'].includes(tag)
      );
      if (typeTag) {
        stats.byType[typeTag] = (stats.byType[typeTag] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching lighting issue stats:', error);
    return { total: 0, open: 0, deferred: 0, resolved: 0, byType: {} };
  }
}
