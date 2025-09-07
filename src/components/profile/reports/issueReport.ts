
import { supabase } from "@/lib/supabase";
import { format, subDays, subWeeks, subMonths, differenceInDays, differenceInHours } from "date-fns";
import { IssueReportDetail, IssueReportMetrics, IssueReportSection, FormattedIssueReport, ReportCallback } from "./types";
import { executeCustomQuery } from "./utils/databaseQueries";
import { PdfGenerator, createMetricsTable, createRecommendationsList, PdfSection } from "./utils/pdfGenerator";
import { handleReportError } from "./utils/reportErrorHandler";
import { Content, TDocumentDefinitions } from "pdfmake/interfaces";

interface IssueTrend {
  period: string;
  total: number;
  open: number;
  resolved: number;
  critical: number;
}

interface CriticalIssue extends IssueReportDetail {
  daysOverdue?: number;
  escalationLevel: 'critical' | 'urgent' | 'high';
  impactDescription: string;
}

interface OngoingIssue extends IssueReportDetail {
  daysSinceCreated: number;
  lastActivity?: string;
  stagnationRisk: 'high' | 'medium' | 'low';
}

function calculateAdvancedMetrics(issues: IssueReportDetail[]): IssueReportMetrics & {
  avgResolutionTime: number;
  escalationRate: number;
  criticalOverdueCount: number;
  stagnantIssuesCount: number;
  weeklyTrend: IssueTrend[];
  monthlyTrend: IssueTrend[];
} {
  const now = new Date();
  const baseMetrics = calculateIssueMetrics(issues);
  
  // Calculate resolution times
  const resolvedIssues = issues.filter(i => i.status === 'resolved' && i.resolution_date);
  const resolutionTimes = resolvedIssues.map(issue => {
    const created = new Date(issue.created_at);
    const resolved = new Date(issue.resolution_date!);
    return differenceInHours(resolved, created);
  });
  
  const avgResolutionTime = resolutionTimes.length > 0 
    ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length 
    : 0;

  // Calculate escalation rate (issues that became high/critical priority)
  const escalatedIssues = issues.filter(i => i.priority === 'high' || i.priority === 'critical');
  const escalationRate = issues.length > 0 ? (escalatedIssues.length / issues.length) * 100 : 0;

  // Count critical overdue issues
  const criticalOverdueCount = issues.filter(i => 
    (i.priority === 'critical' || i.priority === 'high') && 
    i.status !== 'resolved' && 
    i.due_date && 
    new Date(i.due_date) < now
  ).length;

  // Count stagnant issues (open for more than 14 days without activity)
  const stagnantIssuesCount = issues.filter(i => 
    i.status !== 'resolved' && 
    differenceInDays(now, new Date(i.created_at)) > 14
  ).length;

  // Generate weekly trends
  const weeklyTrend: IssueTrend[] = [];
  for (let i = 0; i < 8; i++) {
    const weekStart = subWeeks(now, i + 1);
    const weekEnd = subWeeks(now, i);
    const weekIssues = issues.filter(issue => {
      const created = new Date(issue.created_at);
      return created >= weekStart && created < weekEnd;
    });
    
    weeklyTrend.unshift({
      period: format(weekStart, 'MMM dd'),
      total: weekIssues.length,
      open: weekIssues.filter(i => i.status !== 'resolved').length,
      resolved: weekIssues.filter(i => i.status === 'resolved').length,
      critical: weekIssues.filter(i => i.priority === 'critical' || i.priority === 'high').length
    });
  }

  // Generate monthly trends
  const monthlyTrend: IssueTrend[] = [];
  for (let i = 0; i < 6; i++) {
    const monthStart = subMonths(now, i + 1);
    const monthEnd = subMonths(now, i);
    const monthIssues = issues.filter(issue => {
      const created = new Date(issue.created_at);
      return created >= monthStart && created < monthEnd;
    });
    
    monthlyTrend.unshift({
      period: format(monthStart, 'MMM yyyy'),
      total: monthIssues.length,
      open: monthIssues.filter(i => i.status !== 'resolved').length,
      resolved: monthIssues.filter(i => i.status === 'resolved').length,
      critical: monthIssues.filter(i => i.priority === 'critical' || i.priority === 'high').length
    });
  }

  return {
    ...baseMetrics,
    avgResolutionTime,
    escalationRate,
    criticalOverdueCount,
    stagnantIssuesCount,
    weeklyTrend,
    monthlyTrend
  };
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

function identifyCriticalIssues(issues: IssueReportDetail[]): CriticalIssue[] {
  const now = new Date();
  
  return issues
    .filter(issue => issue.status !== 'resolved')
    .map(issue => {
      const daysOverdue = issue.due_date 
        ? Math.max(0, differenceInDays(now, new Date(issue.due_date)))
        : undefined;
      
      let escalationLevel: 'critical' | 'urgent' | 'high' = 'high';
      let impactDescription = '';

      if (issue.priority === 'critical' || daysOverdue && daysOverdue > 7) {
        escalationLevel = 'critical';
        impactDescription = daysOverdue 
          ? `${daysOverdue} days overdue - immediate attention required`
          : 'Critical priority - system/safety impact';
      } else if (issue.priority === 'high' || daysOverdue && daysOverdue > 3) {
        escalationLevel = 'urgent';
        impactDescription = daysOverdue 
          ? `${daysOverdue} days overdue - escalating priority`
          : 'High priority - significant operational impact';
      } else {
        impactDescription = 'Standard priority issue requiring attention';
      }

      return {
        ...issue,
        daysOverdue,
        escalationLevel,
        impactDescription
      } as CriticalIssue;
    })
    .filter(issue => 
      issue.priority === 'critical' || 
      issue.priority === 'high' || 
      (issue.daysOverdue && issue.daysOverdue > 0)
    )
    .sort((a, b) => {
      // Sort by escalation level first, then by days overdue
      const levelOrder = { critical: 3, urgent: 2, high: 1 };
      if (levelOrder[a.escalationLevel] !== levelOrder[b.escalationLevel]) {
        return levelOrder[b.escalationLevel] - levelOrder[a.escalationLevel];
      }
      return (b.daysOverdue || 0) - (a.daysOverdue || 0);
    });
}

function identifyOngoingIssues(issues: IssueReportDetail[]): OngoingIssue[] {
  const now = new Date();
  
  return issues
    .filter(issue => issue.status !== 'resolved')
    .map(issue => {
      const daysSinceCreated = differenceInDays(now, new Date(issue.created_at));
      
      let stagnationRisk: 'high' | 'medium' | 'low' = 'low';
      if (daysSinceCreated > 30) {
        stagnationRisk = 'high';
      } else if (daysSinceCreated > 14) {
        stagnationRisk = 'medium';
      }

      return {
        ...issue,
        daysSinceCreated,
        stagnationRisk
      } as OngoingIssue;
    })
    .filter(issue => issue.daysSinceCreated > 7) // Only show issues older than a week
    .sort((a, b) => b.daysSinceCreated - a.daysSinceCreated);
}

function generateTrendAnalysis(trends: IssueTrend[], period: string): Content[] {
  const latestPeriod = trends[trends.length - 1];
  const previousPeriod = trends[trends.length - 2];
  
  const trendDirection = latestPeriod && previousPeriod
    ? latestPeriod.total > previousPeriod.total ? 'increasing' : 
      latestPeriod.total < previousPeriod.total ? 'decreasing' : 'stable'
    : 'stable';

  return [
    { text: `${period} Trend Analysis`, style: 'sectionHeader' },
    {
      text: `Overall trend: ${trendDirection}${latestPeriod && previousPeriod 
        ? ` (${latestPeriod.total} vs ${previousPeriod.total} in previous period)` 
        : ''}`
    },
    { text: '\n' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
        body: [
          ['Period', 'Total Created', 'Open', 'Resolved', 'Critical/High'],
          ...trends.map(trend => [
            trend.period,
            trend.total.toString(),
            trend.open.toString(),
            trend.resolved.toString(),
            trend.critical.toString()
          ])
        ]
      },
      layout: 'lightHorizontalLines'
    },
    { text: '\n' }
  ];
}

function generateIssueRecommendations(
  metrics: ReturnType<typeof calculateAdvancedMetrics>,
  criticalIssues: CriticalIssue[],
  ongoingIssues: OngoingIssue[]
): string[] {
  const recommendations: string[] = [];

  // Critical and overdue issues
  if (metrics.criticalOverdueCount > 0) {
    recommendations.push(
      `URGENT: ${metrics.criticalOverdueCount} critical issues are overdue and require immediate attention`
    );
  }

  // Stagnant issues
  if (metrics.stagnantIssuesCount > 5) {
    recommendations.push(
      `${metrics.stagnantIssuesCount} issues have been open for more than 14 days - review for closure or escalation`
    );
  }

  // Resolution time
  if (metrics.avgResolutionTime > 168) { // More than a week
    recommendations.push(
      `Average resolution time is ${Math.round(metrics.avgResolutionTime / 24)} days - consider process improvements`
    );
  }

  // Escalation rate
  if (metrics.escalationRate > 30) {
    recommendations.push(
      `High escalation rate (${metrics.escalationRate.toFixed(1)}%) - review initial triage processes`
    );
  }

  // Trend analysis
  const recentWeeks = metrics.weeklyTrend.slice(-2);
  if (recentWeeks.length === 2 && recentWeeks[1].total > recentWeeks[0].total * 1.5) {
    recommendations.push(
      'Issue creation rate has increased significantly - investigate underlying causes'
    );
  }

  // Type-specific recommendations
  const maintenanceIssues = ongoingIssues.filter(i => i.type?.toLowerCase().includes('maintenance'));
  if (maintenanceIssues.length > 10) {
    recommendations.push(
      `${maintenanceIssues.length} ongoing maintenance issues - review preventive maintenance schedule`
    );
  }

  return recommendations;
}

export async function fetchIssueReport(
  progressCallback: ReportCallback = () => {}
): Promise<FormattedIssueReport> {
  try {
    console.log('Starting issue report generation...');

    // Use the new database query utility
    const query = supabase
      .from('issues')
      .select(`
        id,
        title,
        type,
        status,
        priority,
        created_at,
        due_date,
        resolution_date,
        location
      `)
      .limit(1000)
      .order('created_at', { ascending: false });

    const issues = await executeCustomQuery<IssueReportDetail>(
      query,
      'issues',
      progressCallback
    );

    console.log(`Found ${issues.length} issues`);

    if (issues.length === 0) {
      console.log('No issues found, generating sample report');
      
      const pdfGenerator = new PdfGenerator(progressCallback);
      const noDataRecommendations = [
        'Continue monitoring system performance',
        'Encourage staff to report any issues promptly',
        'Consider implementing proactive maintenance schedules',
        'Review system usage to ensure proper adoption'
      ];

      await pdfGenerator.generatePdf({
        title: 'Issue Analysis Report',
        subtitle: 'System Status: No Issues Found',
        sections: [
          {
            title: 'Executive Summary',
            content: [
              { text: 'No issues found in the database. This indicates either:', style: 'normal' },
              { text: '\n' },
              {
                ul: [
                  'This is a new system with no reported issues yet',
                  'All issues have been successfully resolved',
                  'The system is running smoothly with minimal problems',
                  'Users may not be actively reporting issues through the system'
                ]
              }
            ]
          },
          {
            title: 'System Status',
            content: [
              createMetricsTable({
                'Total Issues': 0,
                'Open Issues': 0,
                'Resolved Issues': 0,
                'Critical Issues': 0,
                'System Health': 'Excellent'
              })
            ]
          },
          {
            title: 'Recommendations',
            content: [createRecommendationsList(noDataRecommendations)]
          }
        ]
      }, `issue_report_sample_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);

      return {
        metadata: { generated_at: new Date().toISOString() },
        metrics: {
          total_issues: 0,
          open_issues: 0,
          resolved_issues: 0,
          overdue_issues: 0,
          priority_distribution: {},
          status_distribution: {}
        },
        sections: []
      };
    }

    progressCallback({
      status: 'generating',
      progress: 60,
      message: 'Analyzing issue patterns and trends...'
    });

    // Transform data to match expected interface
    const formattedIssues: IssueReportDetail[] = issues.map(issue => ({
      ...issue,
      building_name: issue.building_name || 'Unknown Building',
      floor_name: issue.floor_name || 'Unknown Floor',
      room_name: issue.room_name || 'Unknown Room',
      resolution_type: issue.status === 'resolved' ? 'completed' : undefined
    }));

    // Calculate comprehensive metrics
    const metrics = calculateAdvancedMetrics(formattedIssues);
    const criticalIssues = identifyCriticalIssues(formattedIssues);
    const ongoingIssues = identifyOngoingIssues(formattedIssues);
    const recommendations = generateIssueRecommendations(metrics, criticalIssues, ongoingIssues);

    console.log('Building comprehensive report with metrics:', metrics);
    console.log('Critical issues:', criticalIssues.length);
    console.log('Ongoing issues:', ongoingIssues.length);

    const pdfGenerator = new PdfGenerator(progressCallback);
    await pdfGenerator.generatePdf({
      title: 'Comprehensive Issue Analysis Report',
      subtitle: 'Detailed analysis of facility issues, trends, and actionable insights',
      sections: [
        {
          title: 'Executive Summary',
          content: [
            createMetricsTable({
              'Total Issues': metrics.total_issues,
              'Open Issues': metrics.open_issues,
              'Resolved Issues': metrics.resolved_issues,
              'Critical Overdue': metrics.criticalOverdueCount,
              'Resolution Rate (%)': ((metrics.resolved_issues / metrics.total_issues) * 100).toFixed(1),
              'Avg Resolution (days)': Math.round(metrics.avgResolutionTime / 24)
            })
          ]
        },
        {
          title: 'Recommendations',
          content: [createRecommendationsList(recommendations)]
        }
      ]
    }, `comprehensive_issue_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);


    progressCallback({
      status: 'completed',
      progress: 100,
      message: 'Comprehensive issue report generated successfully'
    });

    const sections = organizeIssueSections(formattedIssues);
    return { 
      metadata: { generated_at: new Date().toISOString() }, 
      metrics, 
      sections 
    };

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

