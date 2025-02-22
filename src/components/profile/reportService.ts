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

interface IssueReportSection {
  title: string;
  data: any;
}

interface IssueReportMetrics {
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  overdue_issues: number;
  avg_resolution_time?: string;
  priority_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
}

interface FormattedIssueReport {
  metadata: {
    generated_at: string;
    generated_by?: string;
    report_period?: string;
  };
  metrics: IssueReportMetrics;
  sections: IssueReportSection[];
}

export async function fetchIssueReport(
  progressCallback: ReportCallback = () => {}
): Promise<FormattedIssueReport> {
  try {
    progressCallback({
      status: 'generating',
      progress: 0,
      message: 'Initializing issue report generation...'
    });

    // Fetch detailed issue data
    const { data: issues, error } = await supabase
      .from('issue_report_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      progressCallback({
        status: 'error',
        progress: 0,
        message: `Error fetching issues: ${error.message}`
      });
      throw error;
    }

    progressCallback({
      status: 'generating',
      progress: 30,
      message: 'Processing issue data...'
    });

    // Calculate metrics
    const metrics = calculateIssueMetrics(issues);

    progressCallback({
      status: 'generating',
      progress: 60,
      message: 'Organizing report sections...'
    });

    // Organize data into sections
    const sections = organizeIssueSections(issues);

    progressCallback({
      status: 'generating',
      progress: 90,
      message: 'Finalizing report structure...'
    });

    const report: FormattedIssueReport = {
      metadata: {
        generated_at: new Date().toISOString(),
      },
      metrics,
      sections
    };

    progressCallback({
      status: 'completed',
      progress: 100,
      message: 'Issue report generated successfully'
    });

    return report;
  } catch (error) {
    console.error('Error in fetchIssueReport:', error);
    progressCallback({
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
}

function calculateIssueMetrics(issues: any[]): IssueReportMetrics {
  const now = new Date();
  const metrics: IssueReportMetrics = {
    total_issues: issues.length,
    open_issues: 0,
    resolved_issues: 0,
    overdue_issues: 0,
    priority_distribution: {},
    status_distribution: {}
  };

  issues.forEach(issue => {
    // Status counts
    metrics.status_distribution[issue.status] = 
      (metrics.status_distribution[issue.status] || 0) + 1;

    // Priority distribution
    metrics.priority_distribution[issue.priority] = 
      (metrics.priority_distribution[issue.priority] || 0) + 1;

    // Open vs Resolved
    if (issue.status === 'resolved') {
      metrics.resolved_issues++;
    } else {
      metrics.open_issues++;
      if (issue.due_date && new Date(issue.due_date) < now) {
        metrics.overdue_issues++;
      }
    }
  });

  return metrics;
}

function organizeIssueSections(issues: any[]): IssueReportSection[] {
  const sections: IssueReportSection[] = [
    {
      title: "Overview",
      data: {
        open_issues: issues.filter(i => i.status !== 'resolved'),
        resolved_issues: issues.filter(i => i.status === 'resolved')
      }
    },
    {
      title: "High Priority Issues",
      data: issues.filter(i => i.priority === 'high')
    },
    {
      title: "Issues by Location",
      data: groupIssuesByLocation(issues)
    },
    {
      title: "Maintenance Issues",
      data: issues.filter(i => i.type === 'MAINTENANCE')
    },
    {
      title: "Resolution Statistics",
      data: calculateResolutionStats(issues)
    }
  ];

  return sections;
}

function groupIssuesByLocation(issues: any[]): Record<string, any[]> {
  const locationGroups: Record<string, any[]> = {};

  issues.forEach(issue => {
    const location = [
      issue.building_name,
      issue.floor_name,
      issue.room_name
    ].filter(Boolean).join(" > ");

    if (!locationGroups[location]) {
      locationGroups[location] = [];
    }
    locationGroups[location].push(issue);
  });

  return locationGroups;
}

function calculateResolutionStats(issues: any[]) {
  const resolvedIssues = issues.filter(i => i.status === 'resolved');
  const resolutionTimes = resolvedIssues.map(issue => {
    const created = new Date(issue.created_at);
    const resolved = new Date(issue.resolution_date);
    return resolved.getTime() - created.getTime();
  });

  return {
    total_resolved: resolvedIssues.length,
    average_time: resolutionTimes.length ? 
      Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) : 0,
    resolution_types: resolvedIssues.reduce((acc: Record<string, number>, issue) => {
      acc[issue.resolution_type] = (acc[issue.resolution_type] || 0) + 1;
      return acc;
    }, {})
  };
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
