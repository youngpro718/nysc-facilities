import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { Database } from "@/integrations/supabase/types";

interface ReportProgress {
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number;
  message?: string;
}

type ReportCallback = (progress: ReportProgress) => void;

async function fetchDataWithProgress<T>(
  queryBuilder: PostgrestFilterBuilder<any, any, any>,
  progressCallback: ReportCallback,
  startProgress: number,
  endProgress: number
): Promise<T> {
  progressCallback({
    status: 'generating',
    progress: startProgress,
    message: 'Fetching data...'
  });

  const { data, error } = await queryBuilder;

  if (error) {
    progressCallback({
      status: 'error',
      progress: startProgress,
      message: `Error: ${error.message}`
    });
    throw error;
  }

  if (!data) {
    progressCallback({
      status: 'error',
      progress: startProgress,
      message: 'No data found'
    });
    throw new Error('No data found');
  }

  progressCallback({
    status: 'generating',
    progress: endProgress,
    message: 'Data fetched successfully'
  });

  return data as T;
}

export async function generateRoomReport() {
  const { data, error } = await supabase
    .from("room_health_overview")
    .select("*");

  if (error) throw error;
  return data;
}

export async function generateKeyInventoryReport() {
  const { data: stats, error } = await supabase
    .from("key_inventory_view")
    .select(`
      type,
      total_quantity,
      available_quantity,
      active_assignments,
      returned_assignments,
      lost_count
    `);

  if (error) throw error;
  return stats;
}

export async function fetchFloorplanReportData(progressCallback: ReportCallback = () => {}) {
  try {
    const query = supabase
      .from('buildings')
      .select(`
        *,
        floors:floors(
          *,
          rooms:rooms(*)
        )
      `);

    return await fetchDataWithProgress(query, progressCallback, 0, 100);
  } catch (error) {
    console.error('Error fetching floorplan report data:', error);
    throw error;
  }
}

export async function fetchLightingReport(progressCallback: ReportCallback = () => {}) {
  try {
    const query = supabase
      .from('lighting_fixtures')
      .select(`
        *,
        rooms:rooms(*),
        maintenance_history:maintenance_history(*)
      `);

    return await fetchDataWithProgress(query, progressCallback, 0, 100);
  } catch (error) {
    console.error('Error fetching lighting report data:', error);
    throw error;
  }
}

export async function fetchOccupantReport(progressCallback: ReportCallback = () => {}) {
  try {
    const query = supabase
      .from('occupants')
      .select(`
        *,
        rooms:rooms(*),
        key_assignments:key_assignments(*)
      `);

    return await fetchDataWithProgress(query, progressCallback, 0, 100);
  } catch (error) {
    console.error('Error fetching occupant report data:', error);
    throw error;
  }
}

export async function fetchKeyReport(progressCallback: ReportCallback = () => {}) {
  try {
    const query = supabase
      .from('keys')
      .select(`
        *,
        assignments:key_assignments(
          *,
          occupant:occupants(*),
          room:rooms(*)
        )
      `);

    return await fetchDataWithProgress(query, progressCallback, 0, 100);
  } catch (error) {
    console.error('Error fetching key report data:', error);
    throw error;
  }
}

export async function fetchRoomReport(progressCallback: ReportCallback = () => {}) {
  try {
    const query = supabase
      .from('rooms')
      .select(`
        *,
        floor:floors(*),
        building:buildings(*),
        occupants:occupants(*),
        lighting_fixtures:lighting_fixtures(*)
      `);

    return await fetchDataWithProgress(query, progressCallback, 0, 100);
  } catch (error) {
    console.error('Error fetching room report data:', error);
    throw error;
  }
}

type DbIssue = Database['public']['Tables']['issues']['Row'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbRoom = Database['public']['Tables']['rooms']['Row'];
type DbFloor = Database['public']['Tables']['floors']['Row'];
type DbBuilding = Database['public']['Tables']['buildings']['Row'];
type DbIssueHistory = Database['public']['Tables']['issue_history']['Row'];

interface IssueWithRelations extends Omit<DbIssue, 'room' | 'assignee' | 'timeline'> {
  room?: {
    id: DbRoom['id'];
    name: DbRoom['name'];
    floor?: {
      id: DbFloor['id'];
      name: DbFloor['name'];
      building?: {
        id: DbBuilding['id'];
        name: DbBuilding['name'];
      };
    };
  };
  assignee?: {
    id: DbProfile['id'];
    first_name: DbProfile['first_name'];
    last_name: DbProfile['last_name'];
    email: DbProfile['email'];
  };
  timeline?: DbIssueHistory[];
}

interface ProcessedIssue extends IssueWithRelations {
  location: string;
  assignee_name: string;
}

interface IssueReport {
  generated_at: string;
  total_issues: number;
  status_summary: Record<string, number>;
  priority_summary: Record<string, number>;
  issues: ProcessedIssue[];
}

export async function fetchIssueReport(progressCallback: ReportCallback = () => {}) {
  try {
    progressCallback({
      status: 'generating',
      progress: 0,
      message: 'Preparing to fetch issue data...'
    });

    // First, check if we can connect to the database
    const { data: testConnection, error: connectionError } = await supabase
      .from('issues')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('Database connection error:', connectionError);
      progressCallback({
        status: 'error',
        progress: 0,
        message: `Database connection failed: ${connectionError.message}`
      });
      throw connectionError;
    }

    progressCallback({
      status: 'generating',
      progress: 20,
      message: 'Connected to database, fetching issues...'
    });

    // Fetch issues with related data
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select(`
        id,
        title,
        description,
        type,
        status,
        priority,
        created_at,
        updated_at,
        due_date,
        assignee_id,
        building_id,
        floor_id,
        room_id,
        photos,
        room:rooms(
          id,
          name,
          floor:floors(
            id,
            name,
            building:buildings(
              id,
              name
            )
          )
        ),
        assignee:profiles(
          id,
          first_name,
          last_name,
          email
        ),
        timeline:issue_history(
          id,
          action,
          performed_by,
          performed_at,
          details
        )
      `)
      .order('created_at', { ascending: false });

    if (issuesError) {
      console.error('Error fetching issues:', issuesError);
      progressCallback({
        status: 'error',
        progress: 40,
        message: `Failed to fetch issues: ${issuesError.message}`
      });
      throw issuesError;
    }

    if (!issues || issues.length === 0) {
      progressCallback({
        status: 'completed',
        progress: 100,
        message: 'No issues found in the database'
      });
      return {
        generated_at: new Date().toISOString(),
        total_issues: 0,
        status_summary: {},
        priority_summary: {},
        issues: []
      } as IssueReport;
    }

    progressCallback({
      status: 'generating',
      progress: 60,
      message: 'Processing issue data...'
    });

    // Transform the data to ensure all fields are properly formatted
    const processedIssues = (issues as unknown as IssueWithRelations[]).map(issue => ({
      ...issue,
      // Add computed fields
      location: [
        issue.room?.floor?.building?.name,
        issue.room?.floor?.name,
        issue.room?.name
      ].filter(Boolean).join(' > '),
      assignee_name: issue.assignee ? 
        `${issue.assignee.first_name} ${issue.assignee.last_name}` : 
        'Unassigned',
      // Ensure arrays are properly initialized
      photos: Array.isArray(issue.photos) ? issue.photos : [],
      timeline: Array.isArray(issue.timeline) ? issue.timeline : []
    })) as ProcessedIssue[];

    progressCallback({
      status: 'generating',
      progress: 80,
      message: 'Formatting report data...'
    });

    // Add report metadata
    const reportData: IssueReport = {
      generated_at: new Date().toISOString(),
      total_issues: processedIssues.length,
      status_summary: processedIssues.reduce((acc, issue) => {
        const status = issue.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      priority_summary: processedIssues.reduce((acc, issue) => {
        const priority = issue.priority || 'unknown';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      issues: processedIssues
    };

    progressCallback({
      status: 'completed',
      progress: 100,
      message: `Successfully processed ${processedIssues.length} issues`
    });

    return reportData;
  } catch (error) {
    console.error('Error in fetchIssueReport:', error);
    progressCallback({
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
    throw error;
  }
}

export async function fetchFullDatabaseReport(progressCallback: ReportCallback = () => {}) {
  try {
    progressCallback({ status: 'pending', progress: 0, message: 'Starting full database export...' });

    const queries = {
      buildings: supabase.from('buildings').select('*'),
      floors: supabase.from('floors').select('*'),
      rooms: supabase.from('rooms').select('*'),
      occupants: supabase.from('occupants').select('*'),
      keys: supabase.from('keys').select('*'),
      keyAssignments: supabase.from('key_assignments').select('*'),
      lightingFixtures: supabase.from('lighting_fixtures').select('*'),
      issues: supabase.from('issues').select('*')
    };

    const results = await Promise.all([
      fetchDataWithProgress(queries.buildings, progressCallback, 0, 12),
      fetchDataWithProgress(queries.floors, progressCallback, 12, 25),
      fetchDataWithProgress(queries.rooms, progressCallback, 25, 37),
      fetchDataWithProgress(queries.occupants, progressCallback, 37, 50),
      fetchDataWithProgress(queries.keys, progressCallback, 50, 62),
      fetchDataWithProgress(queries.keyAssignments, progressCallback, 62, 75),
      fetchDataWithProgress(queries.lightingFixtures, progressCallback, 75, 87),
      fetchDataWithProgress(queries.issues, progressCallback, 87, 100)
    ]);

    progressCallback({ status: 'completed', progress: 100, message: 'Full database export completed' });

    const [
      buildings,
      floors,
      rooms,
      occupants,
      keys,
      keyAssignments,
      lightingFixtures,
      issues
    ] = results;

    return {
      buildings,
      floors,
      rooms,
      occupants,
      keys,
      keyAssignments,
      lightingFixtures,
      issues
    };
  } catch (error) {
    console.error('Error fetching full database report:', error);
    throw error;
  }
}

export function downloadReport(data: any, type: string) {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  const fileName = `${type}_report_${timestamp}.json`;
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
