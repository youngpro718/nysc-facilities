import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import pdfMake from "pdfmake/build/pdfmake";
import { Content, TDocumentDefinitions, TableCell } from "pdfmake/interfaces";

interface ReportProgress {
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number;
  message?: string;
}

interface RoomHealthData {
  room_name: string;
  room_number: string;
  building_name: string;
  floor_name: string;
  status: string;
  occupancy_status: string;
  last_inspection_date: string | null;
  health_score: number;
  maintenance_compliance_score: number;
  open_issues_count: number;
  critical_issues_count: number;
  active_critical_issues: number;
  active_recurring_issues: number;
  next_maintenance_due: string | null;
}

interface KeyInventoryData {
  type: string;
  total_quantity: number;
  available_quantity: number;
  active_assignments: number;
  returned_assignments: number;
  lost_count: number;
}

interface FloorPlanRoomData {
  id: string;
  name: string;
  type: string;
  status: string;
  maintenance_history: any[];
  next_maintenance_date: string | null;
}

interface FloorPlanFloorData {
  id: string;
  name: string;
  rooms: FloorPlanRoomData[];
}

interface BuildingFloorplanData {
  id: string;
  name: string;
  floors: {
    id: string;
    name: string;
    rooms: {
      id: string;
      name: string;
      room_type: string;
      status: string;
      maintenance_history: any[];
      next_maintenance_date: string | null;
    }[] | null;
  }[] | null;
}

interface FloorplanReportData {
  id: string;
  name: string;
  floors: FloorPlanFloorData[];
}

type ReportCallback = (progress: ReportProgress) => void;

async function fetchDataWithProgress<T>(
  queryBuilder: PostgrestFilterBuilder<any, any, any>,
  progressCallback: ReportCallback,
  startProgress: number,
  endProgress: number
): Promise<T[]> {
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

  return data as T[];
}

function downloadPdf(docDefinition: TDocumentDefinitions, fileName: string) {
  pdfMake.createPdf(docDefinition).download(fileName);
}

export async function generateRoomReport() {
  const { data: roomData } = await supabase
    .from("room_health_overview")
    .select("*")
    .returns<RoomHealthData[]>();

  if (!roomData) throw new Error('No room data found');
  
  const content: Content[] = [
    { text: 'Room Health Overview Report', style: 'header' },
    { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
    { text: '\n' },
    ...roomData.map(room => ([
      { text: `Room: ${room.room_name || 'N/A'}`, style: 'roomHeader' },
      {
        text: [
          `Building: ${room.building_name || 'N/A'}\n`,
          `Floor: ${room.floor_name || 'N/A'}\n`,
          `Status: ${room.status || 'N/A'}\n`,
          `Occupancy: ${room.occupancy_status || 'N/A'}\n`,
          `Last Inspection: ${room.last_inspection_date ? format(new Date(room.last_inspection_date), 'PP') : 'N/A'}`
        ]
      },
      { text: '\n' }
    ])).flat()
  ];

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
      roomHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
    }
  };

  downloadPdf(docDefinition, `room_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  return roomData;
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

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'Key Inventory Report', style: 'header' },
      { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            ['Type', 'Total', 'Available', 'Active', 'Returned', 'Lost'],
            ...stats.map(row => [
              row.type,
              row.total_quantity.toString(),
              row.available_quantity.toString(),
              row.active_assignments.toString(),
              row.returned_assignments.toString(),
              row.lost_count.toString()
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] }
    }
  };

  downloadPdf(docDefinition, `key_inventory_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  return stats;
}

interface IssueReportDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  photos: string[] | null;
  due_date: string | null;
  resolution_type: string | null;
  resolution_notes: string | null;
  resolution_date: string | null;
  impact_level: string | null;
  tags: string[] | null;
  building_name: string | null;
  floor_name: string | null;
  room_name: string | null;
  room_number: string | null;
  assignee_first_name: string | null;
  assignee_last_name: string | null;
  assignee_email: string | null;
  timeline_events: any[] | null;
  lighting_details: Record<string, any> | null;
  recurring_pattern: Record<string, any> | null;
  maintenance_requirements: Record<string, any> | null;
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

    const { data: issues, error } = await supabase
      .from('issue_report_details')
      .select('*')
      .returns<IssueReportDetail[]>();

    if (error) {
      progressCallback({
        status: 'error',
        progress: 0,
        message: `Error fetching issues: ${error.message}`
      });
      throw error;
    }

    if (!issues) {
      throw new Error('No issue data found');
    }

    progressCallback({
      status: 'generating',
      progress: 30,
      message: 'Processing issue data...'
    });

    const metrics = calculateIssueMetrics(issues);
    const sections = organizeIssueSections(issues);

    progressCallback({
      status: 'generating',
      progress: 90,
      message: 'Generating PDF report...'
    });

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'Issue Report', style: 'header' },
        { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
        { text: '\n' },
        { text: 'Summary', style: 'sectionHeader' },
        {
          ul: [
            `Total Issues: ${metrics.total_issues}`,
            `Open Issues: ${metrics.open_issues}`,
            `Resolved Issues: ${metrics.resolved_issues}`,
            `Overdue Issues: ${metrics.overdue_issues}`
          ]
        },
        { text: '\n' },
        { text: 'Priority Distribution', style: 'sectionHeader' },
        {
          ul: Object.entries(metrics.priority_distribution).map(
            ([priority, count]) => `${priority}: ${count}`
          )
        },
        { text: '\n' },
        { text: 'Status Distribution', style: 'sectionHeader' },
        {
          ul: Object.entries(metrics.status_distribution).map(
            ([status, count]) => `${status}: ${count}`
          )
        },
        { text: '\n' },
        { text: 'Open Issues', style: 'sectionHeader' },
        ...issues
          .filter(issue => issue.status !== 'resolved')
          .map(issue => ({
            table: {
              widths: ['*'],
              body: [[
                {
                  text: issue.title,
                  style: 'issueTitle'
                }
              ],
              [{
                ul: [
                  `Type: ${issue.type}`,
                  `Priority: ${issue.priority}`,
                  `Status: ${issue.status}`,
                  `Location: ${[issue.building_name, issue.floor_name, issue.room_name].filter(Boolean).join(' > ')}`,
                  `Created: ${format(new Date(issue.created_at), 'PP')}`,
                  issue.due_date ? `Due: ${format(new Date(issue.due_date), 'PP')}` : null
                ].filter(Boolean)
              }]]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 10] as [number, number, number, number]
          }))
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        issueTitle: { fontSize: 12, bold: true, margin: [0, 5, 0, 3] }
      }
    };

    downloadPdf(docDefinition, `issue_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);

    progressCallback({
      status: 'completed',
      progress: 100,
      message: 'Issue report generated successfully'
    });

    return { metadata: { generated_at: new Date().toISOString() }, metrics, sections };
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

function calculateIssueMetrics(issues: IssueReportDetail[]): IssueReportMetrics {
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
    metrics.status_distribution[issue.status] = 
      (metrics.status_distribution[issue.status] || 0) + 1;

    metrics.priority_distribution[issue.priority] = 
      (metrics.priority_distribution[issue.priority] || 0) + 1;

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

function organizeIssueSections(issues: IssueReportDetail[]): IssueReportSection[] {
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

function groupIssuesByLocation(issues: IssueReportDetail[]): Record<string, IssueReportDetail[]> {
  const locationGroups: Record<string, IssueReportDetail[]> = {};

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

function calculateResolutionStats(issues: IssueReportDetail[]) {
  const resolvedIssues = issues.filter(i => i.status === 'resolved');
  const resolutionTimes = resolvedIssues.map(issue => {
    const created = new Date(issue.created_at);
    const resolved = new Date(issue.resolution_date || '');
    return resolved.getTime() - created.getTime();
  });

  return {
    total_resolved: resolvedIssues.length,
    average_time: resolutionTimes.length ? 
      Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) : 0,
    resolution_types: resolvedIssues.reduce((acc: Record<string, number>, issue) => {
      const type = issue.resolution_type || 'unspecified';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  };
}

export async function fetchFloorplanReportData(progressCallback: ReportCallback = () => {}) {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select(`
        id,
        name,
        floors:floors(
          id,
          name,
          rooms:rooms(
            id,
            name,
            room_type,
            status,
            maintenance_history,
            next_maintenance_date
          )
        )
      `)
      .returns<BuildingFloorplanData[]>();

    if (error) throw error;
    if (!data) throw new Error('No data found');

    const transformedData: FloorplanReportData[] = data.map(building => ({
      id: building.id,
      name: building.name,
      floors: (building.floors || []).map(floor => ({
        id: floor.id,
        name: floor.name,
        rooms: (floor.rooms || []).map(room => ({
          id: room.id,
          name: room.name,
          type: room.room_type,
          status: room.status,
          maintenance_history: room.maintenance_history || [],
          next_maintenance_date: room.next_maintenance_date
        }))
      }))
    }));

    const docContent: Content[] = [
      { text: 'Floorplan Report', style: 'header' },
      { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
      { text: '\n' },
      ...transformedData.map(building => [
        { text: building.name, style: 'buildingHeader' },
        ...(building.floors || []).map(floor => [
          { text: floor.name, style: 'floorHeader' },
          {
            table: {
              widths: ['*'],
              body: floor.rooms.map(room => [[
                {
                  text: `${room.name} - ${room.type} (${room.status})`,
                  style: 'roomItem'
                }
              ]])
            },
            layout: 'noBorders',
            margin: [10, 0, 0, 0] as [number, number, number, number]
          },
          { text: '\n' }
        ]).flat()
      ]).flat()
    ];

    const docDefinition: TDocumentDefinitions = {
      content: docContent,
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
        buildingHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
        floorHeader: { fontSize: 14, bold: true, margin: [0, 5, 0, 5] },
        roomList: { margin: [10, 0, 0, 0] as [number, number, number, number] },
        roomItem: { fontSize: 12 }
      }
    };

    downloadPdf(docDefinition, `floorplan_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    return transformedData;
  } catch (error) {
    console.error('Error fetching floorplan report data:', error);
    throw error;
  }
}

export async function fetchLightingReport(progressCallback: ReportCallback = () => {}) {
  try {
    const data = await fetchDataWithProgress(
      supabase.from('lighting_fixtures').select(`
        *,
        rooms:rooms(*),
        maintenance_history:maintenance_history(*)
      `),
      progressCallback,
      0,
      100
    );

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'Lighting Fixtures Report', style: 'header' },
        { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              ['Location', 'Type', 'Status', 'Last Maintenance', 'Next Due'],
              ...data.map(fixture => [
                fixture.rooms?.name || 'N/A',
                fixture.type,
                fixture.status,
                fixture.maintenance_history?.[0]?.date ? 
                  format(new Date(fixture.maintenance_history[0].date), 'PP') : 'N/A',
                fixture.next_maintenance_date ? 
                  format(new Date(fixture.next_maintenance_date), 'PP') : 'N/A'
              ])
            ]
          }
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] }
      }
    };

    downloadPdf(docDefinition, `lighting_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    return data;
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
  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`, style: 'header' },
      { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
      { text: '\n' },
      { text: JSON.stringify(data, null, 2), style: 'code' }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
      code: { font: 'Courier', fontSize: 10 }
    }
  };

  downloadPdf(docDefinition, `${type}_report_${timestamp}.pdf`);
}
