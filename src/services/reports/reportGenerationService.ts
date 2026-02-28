// @ts-nocheck
// Report Generation Service
/**
 * Report Generation Service
 * Phase 4: Advanced reporting capabilities
 * Generates PDF reports, CSV exports, and scheduled reports
 */

import { AdvancedAnalyticsService } from '@/services/analytics/advancedAnalyticsService';
import { logger } from '@/lib/logger';
import { OptimizedSpacesService } from '@/services/optimized/spacesService';
import { fetchLightingFixtures } from '@/lib/supabase';
import type { LightingFixture, LightStatus } from '@/types/lighting';

// Report interfaces
export interface ReportConfig {
  title: string;
  subtitle?: string;
  buildingId?: string;
  dateRange?: { start: string; end: string };
  sections: ReportSection[];
  format: 'pdf' | 'csv' | 'json';
  includeCharts?: boolean;
  includeRecommendations?: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'table' | 'chart' | 'recommendations' | 'analytics';
  data?: unknown;
  config?: unknown;
}

export interface GeneratedReport {
  id: string;
  title: string;
  generated_at: string;
  format: string;
  size_bytes: number;
  download_url?: string;
  data?: unknown;
}

export interface LightingAuditorReportOptions {
  format: 'pdf' | 'csv' | 'json';
  buildingId?: string;
  floorId?: string;
  status?: LightStatus | 'out' | 'all';
  selectedFixtureIds?: string[];
  fixtures?: LightingFixture[]; // optionally pass pre-filtered fixtures (e.g., current view)
}

/**
 * Report Generation Service Class
 * Handles all report generation and export functionality
 */
export class ReportGenerationService {

  /**
   * Generate a comprehensive facility report
   */
  static async generateFacilityReport(config: ReportConfig): Promise<GeneratedReport> {
    try {
      const reportId = `report_${crypto.randomUUID()}`;
      
      // Gather all required data
      const [
        facilityReport,
        dashboardData,
        hierarchyData,
        optimizationData,
      ] = await Promise.all([
        AdvancedAnalyticsService.generateFacilityReport(config.buildingId),
        OptimizedSpacesService.getDashboardData({ buildingId: config.buildingId }),
        OptimizedSpacesService.getBuildingHierarchy(),
        AdvancedAnalyticsService.getSpaceOptimizationRecommendations(),
      ]);

      // Build report structure
      const reportData = {
        metadata: {
          id: reportId,
          title: config.title,
          subtitle: config.subtitle,
          generated_at: new Date().toISOString(),
          building_id: config.buildingId,
          date_range: config.dateRange,
          format: config.format,
        },
        executive_summary: {
          total_spaces: facilityReport.summary.total_spaces,
          average_utilization: facilityReport.summary.average_utilization,
          total_issues: facilityReport.summary.total_issues,
          maintenance_priority_count: facilityReport.summary.maintenance_priority_count,
          key_insights: this.generateKeyInsights(facilityReport),
        },
        sections: await this.buildReportSections(config.sections, {
          facilityReport,
          dashboardData,
          hierarchyData,
          optimizationData,
        }),
      };

      // Generate report based on format
      let generatedReport: GeneratedReport;
      
      switch (config.format) {
        case 'pdf':
          generatedReport = await this.generatePDFReport(reportData);
          break;
        case 'csv':
          generatedReport = await this.generateCSVReport(reportData);
          break;
        case 'json':
          generatedReport = this.generateJSONReport(reportData);
          break;
        default:
          throw new Error(`Unsupported report format: ${config.format}`);
      }

      return generatedReport;
    } catch (error) {
      logger.error('Error generating facility report:', error);
      throw error;
    }
  }

  /**
   * Generate Lighting Auditor Report
   * Produces a comprehensive export of lighting fixtures suitable for auditors.
   * Supports CSV, JSON, and a simple PDF (HTML) format.
   */
  static async generateLightingAuditorReport(options: LightingAuditorReportOptions): Promise<GeneratedReport> {
    const reportId = `lighting_auditor_${crypto.randomUUID()}`;
    const title = 'Lighting Auditor Export';

    // 1) Get fixtures: prefer provided list (e.g., current filtered fixtures in UI); else fetch all
    let fixtures: LightingFixture[] = Array.isArray(options.fixtures)
      ? options.fixtures
      : await fetchLightingFixtures();

    // 2) Apply optional filters
    if (options.selectedFixtureIds && options.selectedFixtureIds.length > 0) {
      const set = new Set(options.selectedFixtureIds);
      fixtures = fixtures.filter(f => set.has(f.id));
    }

    if (options.status && options.status !== 'all') {
      fixtures = fixtures.filter(f => options.status === 'out' ? f.status !== 'functional' : f.status === options.status);
    }

    if (options.buildingId) {
      // building_id may be undefined in some fetch paths; also attempt building_name match if provided id is actually a name
      fixtures = fixtures.filter(f => ((f as Record<string, unknown>)).building_id === options.buildingId || f.building_name === options.buildingId);
    }

    if (options.floorId) {
      fixtures = fixtures.filter(f => ((f as Record<string, unknown>)).floor_id === options.floorId || f.floor_name === options.floorId);
    }

    // 3) Prepare dataset
    const headers = [
      'Fixture ID', 'Name', 'Type', 'Technology', 'Status',
      'Requires Electrician', 'Ballast Issue', 'Bulb Count', 'Position',
      'Space Type', 'Space Name', 'Room Number', 'Zone',
      'Building', 'Floor',
      'Reported Out Date', 'Replaced Date', 'Outage Minutes', 'Repair Minutes',
      'Notes', 'Created At', 'Updated At'
    ];

    const rows = fixtures.map(f => ([
      f.id,
      f.name ?? '',
      f.type ?? '',
      f.technology ?? '',
      f.status ?? '',
      String(f.requires_electrician ?? false),
      String(f.ballast_issue ?? false),
      String(f.bulb_count ?? ''),
      f.position ?? '',
      f.space_type ?? '',
      f.space_name ?? '',
      f.room_number ?? '',
      ((f as Record<string, unknown>)).zone_name ?? '',
      f.building_name ?? '',
      f.floor_name ?? '',
      f.reported_out_date ?? '',
      f.replaced_date ?? '',
      f.outage_minutes != null ? String(f.outage_minutes) : '',
      f.repair_minutes != null ? String(f.repair_minutes) : '',
      f.notes ?? '',
      f.created_at ?? '',
      f.updated_at ?? ''
    ]));

    const generatedAt = new Date().toISOString();

    switch (options.format) {
      case 'csv': {
        const csvContent = [
          headers.join(','),
          ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        return {
          id: reportId,
          title,
          generated_at: generatedAt,
          format: 'csv',
          size_bytes: csvContent.length,
          data: csvContent,
        };
      }
      case 'json': {
        const json = JSON.stringify({
          metadata: {
            id: reportId,
            title,
            generated_at: generatedAt,
            total_fixtures: fixtures.length,
          },
          fixtures,
        }, null, 2);
        return {
          id: reportId,
          title,
          generated_at: generatedAt,
          format: 'json',
          size_bytes: json.length,
          data: json,
        };
      }
      case 'pdf': {
        // Simple HTML representation suitable for printing/exporting to PDF client-side
        const html = this.generateLightingPDFContent({ title, generatedAt, headers, rows, total: fixtures.length });
        return {
          id: reportId,
          title,
          generated_at: generatedAt,
          format: 'pdf',
          size_bytes: html.length * 2,
          data: html,
        };
      }
      default:
        throw new Error(`Unsupported lighting report format: ${options.format}`);
    }
  }

  /**
   * Generate a maintenance report
   */
  static async generateMaintenanceReport(buildingId?: string): Promise<GeneratedReport> {
    const config: ReportConfig = {
      title: 'Maintenance Priority Report',
      subtitle: buildingId ? `Building-specific report` : 'All facilities',
      buildingId,
      format: 'pdf',
      sections: [
        { id: 'maintenance-summary', title: 'Maintenance Summary', type: 'summary' },
        { id: 'priority-list', title: 'Priority Maintenance List', type: 'table' },
        { id: 'recommendations', title: 'Recommendations', type: 'recommendations' },
      ],
    };

    return this.generateFacilityReport(config);
  }

  /**
   * Generate an energy efficiency report
   */
  static async generateEnergyReport(buildingId?: string): Promise<GeneratedReport> {
    const config: ReportConfig = {
      title: 'Energy Efficiency Analysis',
      subtitle: 'Lighting and energy usage report',
      buildingId,
      format: 'pdf',
      includeCharts: true,
      sections: [
        { id: 'energy-summary', title: 'Energy Overview', type: 'summary' },
        { id: 'efficiency-analysis', title: 'Efficiency Analysis', type: 'analytics' },
        { id: 'savings-opportunities', title: 'Savings Opportunities', type: 'recommendations' },
      ],
    };

    return this.generateFacilityReport(config);
  }

  /**
   * Generate a utilization report
   */
  static async generateUtilizationReport(
    buildingId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<GeneratedReport> {
    const config: ReportConfig = {
      title: 'Space Utilization Report',
      subtitle: 'Occupancy and usage analysis',
      buildingId,
      dateRange,
      format: 'pdf',
      includeCharts: true,
      sections: [
        { id: 'utilization-summary', title: 'Utilization Overview', type: 'summary' },
        { id: 'trends-analysis', title: 'Usage Trends', type: 'analytics' },
        { id: 'optimization', title: 'Optimization Opportunities', type: 'recommendations' },
      ],
    };

    return this.generateFacilityReport(config);
  }

  /**
   * Export dashboard data to CSV
   */
  static async exportDashboardCSV(buildingId?: string): Promise<GeneratedReport> {
    try {
      const dashboardData = await OptimizedSpacesService.getDashboardData({ buildingId });
      
      // Convert to CSV format
      const csvHeaders = [
        'Space ID', 'Name', 'Type', 'Building', 'Floor', 'Status',
        'Occupants', 'Open Issues', 'Fixtures', 'Room Number'
      ];

      const csvRows = dashboardData.map(space => [
        space.id,
        space.name,
        space.space_type,
        space.building_name,
        space.floor_name,
        space.status,
        space.occupant_count,
        space.open_issue_count,
        space.fixture_count,
        space.room_number || '',
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const reportId = `csv_export_${Date.now()}`;
      
      return {
        id: reportId,
        title: 'Dashboard Data Export',
        generated_at: new Date().toISOString(),
        format: 'csv',
        size_bytes: csvContent.length,
        data: csvContent,
      };
    } catch (error) {
      logger.error('Error exporting dashboard CSV:', error);
      throw error;
    }
  }

  /**
   * Generate key insights from facility data
   */
  private static generateKeyInsights(facilityReport: Record<string, unknown>): string[] {
    const insights: string[] = [];

    // Utilization insights
    if (facilityReport.summary.average_utilization < 60) {
      insights.push(`Space utilization is below optimal at ${facilityReport.summary.average_utilization}%`);
    } else if (facilityReport.summary.average_utilization > 85) {
      insights.push(`High space utilization at ${facilityReport.summary.average_utilization}% may indicate overcrowding`);
    }

    // Issue insights
    if (facilityReport.summary.total_issues > 20) {
      insights.push(`${facilityReport.summary.total_issues} total issues require attention`);
    }

    // Maintenance insights
    if (facilityReport.summary.maintenance_priority_count > 5) {
      insights.push(`${facilityReport.summary.maintenance_priority_count} spaces need priority maintenance`);
    }

    // Energy insights
    const energyData = facilityReport.energy_efficiency;
    if (energyData && energyData.length > 0) {
      const totalSavings = energyData.reduce((sum: number, e: Record<string, unknown>) => sum + e.potential_savings, 0);
      if (totalSavings > 1000) {
        insights.push(`Potential energy savings of $${totalSavings.toLocaleString()} identified`);
      }
    }

    return insights;
  }

  /**
   * Build report sections based on configuration
   */
  private static async buildReportSections(
    sectionConfigs: ReportSection[],
    data: unknown
  ): Promise<ReportSection[]> {
    const sections: ReportSection[] = [];

    for (const config of sectionConfigs) {
      const section: ReportSection = {
        ...config,
        data: await this.getSectionData(config, data),
      };
      sections.push(section);
    }

    return sections;
  }

  /**
   * Get data for a specific report section
   */
  private static async getSectionData(section: ReportSection, allData: Record<string, unknown>): Promise<unknown> {
    switch (section.id) {
      case 'maintenance-summary':
        return {
          total_spaces: allData.dashboardData.length,
          critical_maintenance: allData.facilityReport.maintenance_analytics.filter((m: Record<string, unknown>) => m.maintenance_score < 50).length,
          average_score: allData.facilityReport.maintenance_analytics.reduce((sum: number, m: Record<string, unknown>) => sum + m.maintenance_score, 0) / allData.facilityReport.maintenance_analytics.length,
        };

      case 'priority-list':
        return allData.facilityReport.maintenance_analytics
          .filter((m: Record<string, unknown>) => m.maintenance_score < 70)
          .sort((a: Record<string, unknown>, b: Record<string, unknown>) => a.maintenance_score - b.maintenance_score)
          .slice(0, 20);

      case 'energy-summary':
        return {
          total_buildings: allData.facilityReport.energy_efficiency.length,
          average_efficiency: allData.facilityReport.energy_efficiency.reduce((sum: number, e: Record<string, unknown>) => sum + e.efficiency_score, 0) / allData.facilityReport.energy_efficiency.length,
          total_potential_savings: allData.facilityReport.energy_efficiency.reduce((sum: number, e: Record<string, unknown>) => sum + e.potential_savings, 0),
        };

      case 'utilization-summary':
        return {
          total_spaces: allData.facilityReport.summary.total_spaces,
          average_utilization: allData.facilityReport.summary.average_utilization,
          utilization_by_building: allData.facilityReport.utilization,
        };

      case 'recommendations':
        return allData.optimizationData.slice(0, 10);

      default:
        return null;
    }
  }

  /**
   * Generate PDF report (simplified - would use a PDF library in production)
   */
  private static async generatePDFReport(reportData: Record<string, unknown>): Promise<GeneratedReport> {
    // In a real implementation, you would use libraries like:
    // - jsPDF
    // - Puppeteer
    // - React-PDF
    // - PDFKit
    
    const pdfContent = this.generatePDFContent(reportData);
    
    return {
      id: reportData.metadata.id,
      title: reportData.metadata.title,
      generated_at: reportData.metadata.generated_at,
      format: 'pdf',
      size_bytes: pdfContent.length * 2, // Estimate
      data: pdfContent, // Would be actual PDF buffer in production
    };
  }

  /**
   * Generate CSV report
   */
  private static async generateCSVReport(reportData: Record<string, unknown>): Promise<GeneratedReport> {
    const csvData = this.convertToCSV(reportData);
    
    return {
      id: reportData.metadata.id,
      title: reportData.metadata.title,
      generated_at: reportData.metadata.generated_at,
      format: 'csv',
      size_bytes: csvData.length,
      data: csvData,
    };
  }

  /**
   * Generate JSON report
   */
  private static generateJSONReport(reportData: Record<string, unknown>): GeneratedReport {
    const jsonData = JSON.stringify(reportData, null, 2);
    
    return {
      id: reportData.metadata.id,
      title: reportData.metadata.title,
      generated_at: reportData.metadata.generated_at,
      format: 'json',
      size_bytes: jsonData.length,
      data: jsonData,
    };
  }

  /**
   * Generate PDF content (simplified HTML representation)
   */
  private static generatePDFContent(reportData: Record<string, unknown>): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${reportData.metadata.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 30px 0; }
        .summary-card { background: #f5f5f5; padding: 20px; margin: 10px 0; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .insight { background: #e3f2fd; padding: 15px; margin: 10px 0; border-left: 4px solid #2196f3; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${reportData.metadata.title}</h1>
        ${reportData.metadata.subtitle ? `<h2>${reportData.metadata.subtitle}</h2>` : ''}
        <p>Generated on: ${new Date(reportData.metadata.generated_at).toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="summary-card">
            <h3>Key Metrics</h3>
            <ul>
                <li>Total Spaces: ${reportData.executive_summary.total_spaces}</li>
                <li>Average Utilization: ${reportData.executive_summary.average_utilization}%</li>
                <li>Total Issues: ${reportData.executive_summary.total_issues}</li>
                <li>Priority Maintenance: ${reportData.executive_summary.maintenance_priority_count}</li>
            </ul>
        </div>
        
        <h3>Key Insights</h3>
        ${reportData.executive_summary.key_insights.map((insight: string) => 
          `<div class="insight">${insight}</div>`
        ).join('')}
    </div>

    ${reportData.sections.map((section: Record<string, unknown>) => `
        <div class="section">
            <h2>${section.title}</h2>
            ${this.renderSectionContent(section)}
        </div>
    `).join('')}

    <div class="section">
        <p><em>This report was generated automatically by the NYSC Facilities Management System.</em></p>
    </div>
</body>
</html>`;
  }

  /**
   * Generate simple HTML for Lighting Auditor report table
   */
  private static generateLightingPDFContent(args: { title: string; generatedAt: string; headers: string[]; rows: string[][]; total: number }): string {
    const { title, generatedAt, headers, rows, total } = args;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
    h1 { margin: 0 0 8px; }
    .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; position: sticky; top: 0; }
    .summary { margin: 12px 0 16px; font-weight: bold; }
  </style>
  </head>
  <body>
    <h1>${title}</h1>
    <div class="meta">Generated: ${new Date(generatedAt).toLocaleString()}</div>
    <div class="summary">Total fixtures: ${total}</div>
    <table>
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(r => `<tr>${r.map(c => `<td>${String(c ?? '')}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </body>
  </html>`;
  }

  /**
   * Render section content for PDF
   */
  private static renderSectionContent(section: Record<string, unknown>): string {
    if (!section.data) return '<p>No data available for this section.</p>';

    switch (section.type) {
      case 'table':
        if (Array.isArray(section.data)) {
          const headers = Object.keys(section.data[0] || {});
          return `
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${section.data.map((row: Record<string, unknown>) => 
                      `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
                    ).join('')}
                </tbody>
            </table>`;
        }
        break;

      case 'summary':
        return `
          <div class="summary-card">
            ${Object.entries(section.data).map(([key, value]) => 
              `<p><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</p>`
            ).join('')}
          </div>`;

      default:
        return `<pre>${JSON.stringify(section.data, null, 2)}</pre>`;
    }

    return '<p>Unable to render section content.</p>';
  }

  /**
   * Convert report data to CSV format
   */
  private static convertToCSV(reportData: Record<string, unknown>): string {
    const rows: string[] = [];
    
    // Add metadata
    rows.push('Report Metadata');
    rows.push(`Title,${reportData.metadata.title}`);
    rows.push(`Generated,${reportData.metadata.generated_at}`);
    rows.push('');

    // Add executive summary
    rows.push('Executive Summary');
    rows.push(`Total Spaces,${reportData.executive_summary.total_spaces}`);
    rows.push(`Average Utilization,${reportData.executive_summary.average_utilization}%`);
    rows.push(`Total Issues,${reportData.executive_summary.total_issues}`);
    rows.push('');

    // Add sections
    reportData.sections.forEach((section: Record<string, unknown>) => {
      rows.push(section.title);
      if (Array.isArray(section.data)) {
        const headers = Object.keys(section.data[0] || {});
        rows.push(headers.join(','));
        section.data.forEach((row: Record<string, unknown>) => {
          rows.push(headers.map(h => `"${row[h] || ''}"`).join(','));
        });
      }
      rows.push('');
    });

    return rows.join('\n');
  }

  /**
   * Schedule a report for automatic generation
   */
  static async scheduleReport(
    config: ReportConfig & { 
      schedule: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
    }
  ): Promise<{ success: boolean; scheduleId?: string }> {
    try {
      // In a real implementation, this would:
      // 1. Store the schedule in the database
      // 2. Set up a cron job or scheduled task
      // 3. Configure email delivery
      
      const scheduleId = `schedule_${crypto.randomUUID()}`;
      
      logger.debug(`Scheduled report "${config.title}" for ${config.schedule} delivery to:`, config.recipients);
      
      return { success: true, scheduleId };
    } catch (error) {
      logger.error('Error scheduling report:', error);
      return { success: false };
    }
  }
}

// Export default instance
export const reportGenerationService = ReportGenerationService;
