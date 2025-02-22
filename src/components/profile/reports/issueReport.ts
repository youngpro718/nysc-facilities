
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { IssueReportDetail, IssueReportMetrics, IssueReportSection, FormattedIssueReport, ReportCallback } from "./types";
import { downloadPdf } from "./reportUtils";

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
  return [
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

