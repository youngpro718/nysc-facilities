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
  issue_id: string; // Link to main issues table
}

/**
 * Create a new lighting issue and link it to the main issues system
 */
export async function createLightingIssue(data: LightingIssueCreateData): Promise<{
  lightingIssue: LightingIssue;
  mainIssue: any;
}> {
  try {
    // First, create the lighting-specific issue
    const { data: lightingIssue, error: lightingError } = await supabase
      .from('lighting_issues')
      .insert({
        fixture_id: data.fixture_id,
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

    // Then create a corresponding entry in the main issues table
    const issueTitle = `Lighting Issue: ${data.issue_type.replace('_', ' ')} - ${data.location}`;
    const mappedPriority = data.priority === 'critical' ? 'high' : (data.priority || 'medium');
    const { data: mainIssue, error: mainError } = await supabase
      .from('issues')
      .insert({
        title: issueTitle,
        issue_type: 'lighting',
        description: `${data.issue_type.replace('_', ' ')} reported at ${data.location}. Bulb type: ${data.bulb_type}. ${data.notes || ''}`,
        location_description: data.location,
        status: 'open',
        priority: mappedPriority,
        reported_by: data.reported_by,
        created_by: data.reported_by,
        tags: ['lighting', data.issue_type],
      })
      .select()
      .single();

    if (mainError) throw mainError;

    // Update the lighting issue with the main issue ID
    await supabase
      .from('lighting_issues')
      .update({ issue_id: mainIssue.id })
      .eq('id', lightingIssue.id);

    // Update the lighting fixture status to indicate there's an issue
    await supabase
      .from('lighting_fixtures')
      .update({ 
        status: 'non_functional',
        reported_out_date: new Date().toISOString()
      })
      .eq('id', data.fixture_id);

    return { 
      lightingIssue: {
        ...lightingIssue,
        issue_type: lightingIssue.issue_type as 'blown_bulb' | 'ballast_issue' | 'other',
        status: lightingIssue.status as 'open' | 'deferred' | 'resolved'
      }, 
      mainIssue 
    };
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
    const { data, error } = await supabase
      .from('lighting_issues')
      .select('*')
      .order('reported_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      location: item.location,
      bulb_type: item.bulb_type,
      form_factor: item.form_factor,
      issue_type: item.issue_type as 'blown_bulb' | 'ballast_issue' | 'other',
      status: item.status as 'open' | 'deferred' | 'resolved',
      notes: item.notes,
      reported_at: item.reported_at,
      resolved_at: item.resolved_at,
      fixture_name: 'Unknown Fixture',
      room_number: 'Unknown Room',
      floor_name: 'Unknown Floor',
      building_name: 'Unknown Building',
      reported_by_name: 'Unknown User',
      issue_id: item.issue_id,
    }));
  } catch (error) {
    console.error('Error fetching lighting issues:', error);
    return [];
  }
}

/**
 * Update a lighting issue
 */
export async function updateLightingIssue(
  id: string, 
  data: LightingIssueUpdateData
): Promise<LightingIssue> {
  try {
    const { data: lightingIssue, error } = await supabase
      .from('lighting_issues')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If status changed to resolved, update the main issue and fixture
    if (data.status === 'resolved') {
      await supabase
        .from('issues')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: data.resolved_by
        })
        .eq('id', lightingIssue.issue_id);

      // Update the lighting fixture status
      await supabase
        .from('lighting_fixtures')
        .update({ 
          status: 'functional',
          replaced_date: new Date().toISOString()
        })
        .eq('id', lightingIssue.fixture_id);
    }

    return {
      ...lightingIssue,
      issue_type: lightingIssue.issue_type as 'blown_bulb' | 'ballast_issue' | 'other',
      status: lightingIssue.status as 'open' | 'deferred' | 'resolved'
    };
  } catch (error) {
    console.error('Error updating lighting issue:', error);
    throw error;
  }
}

/**
 * Get lighting issues by status
 */
export async function getLightingIssuesByStatus(
  status: LightingIssueStatus
): Promise<LightingIssueWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('lighting_issues')
      .select('*')
      .eq('status', status)
      .order('reported_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      location: item.location,
      bulb_type: item.bulb_type,
      form_factor: item.form_factor,
      issue_type: item.issue_type as 'blown_bulb' | 'ballast_issue' | 'other',
      status: item.status as 'open' | 'deferred' | 'resolved',
      notes: item.notes,
      reported_at: item.reported_at,
      resolved_at: item.resolved_at,
      fixture_name: 'Unknown Fixture',
      room_number: 'Unknown Room',
      floor_name: 'Unknown Floor',
      building_name: 'Unknown Building',
      reported_by_name: 'Unknown User',
      issue_id: item.issue_id,
    }));
  } catch (error) {
    console.error('Error fetching lighting issues by status:', error);
    return [];
  }
}

/**
 * Get lighting issues for a specific fixture
 */
export async function getLightingIssuesForFixture(
  fixtureId: string
): Promise<LightingIssue[]> {
  try {
    const { data, error } = await supabase
      .from('lighting_issues')
      .select('*')
      .eq('fixture_id', fixtureId)
      .order('reported_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      issue_type: item.issue_type as 'blown_bulb' | 'ballast_issue' | 'other',
      status: item.status as 'open' | 'deferred' | 'resolved'
    }));
  } catch (error) {
    console.error('Error fetching lighting issues for fixture:', error);
    return [];
  }
}

/**
 * Delete a lighting issue
 */
export async function deleteLightingIssue(id: string): Promise<boolean> {
  try {
    // First get the lighting issue to find the main issue ID
    const { data: lightingIssue } = await supabase
      .from('lighting_issues')
      .select('issue_id, fixture_id')
      .eq('id', id)
      .single();

    if (!lightingIssue) return false;

    // Delete from lighting_issues
    const { error: lightingError } = await supabase
      .from('lighting_issues')
      .delete()
      .eq('id', id);

    if (lightingError) throw lightingError;

    // Delete from main issues
    if (lightingIssue.issue_id) {
      await supabase
        .from('issues')
        .delete()
        .eq('id', lightingIssue.issue_id);
    }

    return true;
  } catch (error) {
    console.error('Error deleting lighting issue:', error);
    return false;
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
      .from('lighting_issues')
      .select('status, issue_type');

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
      stats.byType[issue.issue_type] = (stats.byType[issue.issue_type] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching lighting issue stats:', error);
    return { total: 0, open: 0, deferred: 0, resolved: 0, byType: {} };
  }
}
