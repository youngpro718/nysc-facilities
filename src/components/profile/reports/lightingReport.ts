import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { ReportCallback, LightingFixture } from "./types";
import { 
  downloadPdf, 
  fetchDataWithProgress, 
  generateReportHeader, 
  generateMetricsSection,
  generateRecommendationsSection,
  calculateMetrics 
} from "./reportUtils";

export async function fetchLightingReport(progressCallback: ReportCallback = () => {}) {
  try {
    // Updated query to match actual database schema
    const query = supabase
      .from('lighting_fixtures')
      .select(`
        id,
        name,
        type,
        status,
        technology,
        installation_date,
        last_maintenance_date,
        next_maintenance_date,
        maintenance_history,
        electrical_issues,
        zone_id,
        room_id,
        room_number,
        lighting_zones!inner(name)
      `);
      
    const data = await fetchDataWithProgress<LightingFixture>(
      query,
      progressCallback,
      0,
      70
    );

    progressCallback({
      status: 'generating',
      progress: 80,
      message: 'Processing lighting data...'
    });

    // Calculate metrics
    const metrics = calculateMetrics(data, (fixture) => fixture.status);
    const technologyMetrics = calculateMetrics(data, (fixture) => fixture.technology || 'Unknown');

    // Generate recommendations
    const recommendations = generateRecommendations(data, metrics);

    progressCallback({
      status: 'generating',
      progress: 90,
      message: 'Generating PDF document...'
    });

    const content: Content[] = [
      ...generateReportHeader('Lighting Fixtures Report', 'Comprehensive analysis of lighting infrastructure'),
      ...generateMetricsSection(metrics),
      
      // Technology breakdown
      { text: 'Technology Distribution', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            ['Technology', 'Count', 'Percentage'],
            ...Object.entries(technologyMetrics.categories).map(([tech, count]) => [
              tech,
              count.toString(),
              `${((count / data.length) * 100).toFixed(1)}%`
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '\n' },

      // Maintenance status
      { text: 'Maintenance Overview', style: 'sectionHeader' },
      generateMaintenanceTable(data),
      { text: '\n' },

      // Detailed fixtures table
      { text: 'Fixture Details', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', '*', 'auto'],
          body: [
            ['Name', 'Type', 'Status', 'Zone', 'Last Maintenance'],
            ...data.map(fixture => [
              fixture.name,
              fixture.type,
              fixture.status,
              fixture.lighting_zones?.name || 'N/A',
              fixture.last_maintenance_date ? 
                format(new Date(fixture.last_maintenance_date), 'PP') : 'N/A'
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '\n' },

      ...generateRecommendationsSection(recommendations)
    ];

    const docDefinition: TDocumentDefinitions = {
      content
    };

    progressCallback({
      status: 'generating',
      progress: 95,
      message: 'Downloading report...'
    });

    await downloadPdf(docDefinition, `lighting_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    
    progressCallback({
      status: 'completed',
      progress: 100,
      message: 'Report generated successfully'
    });

    return data;
  } catch (error) {
    progressCallback({
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Failed to generate lighting report'
    });
    throw error;
  }
}

function generateMaintenanceTable(data: LightingFixture[]): Content {
  const maintenanceData = data.map(fixture => ({
    name: fixture.name,
    lastMaintenance: fixture.last_maintenance_date,
    nextMaintenance: fixture.next_maintenance_date,
    status: fixture.status
  }));

  const overdueFixtures = maintenanceData.filter(f => 
    f.nextMaintenance && new Date(f.nextMaintenance) < new Date()
  );

  return {
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto'],
      body: [
        ['Fixture', 'Last Maintenance', 'Next Maintenance', 'Status'],
        ...maintenanceData.slice(0, 10).map(fixture => [
          fixture.name,
          fixture.lastMaintenance ? format(new Date(fixture.lastMaintenance), 'PP') : 'N/A',
          fixture.nextMaintenance ? format(new Date(fixture.nextMaintenance), 'PP') : 'N/A',
          fixture.status
        ])
      ]
    },
    layout: 'lightHorizontalLines'
  };
}

function generateRecommendations(data: LightingFixture[], metrics: any): string[] {
  const recommendations: string[] = [];
  
  const functionalCount = metrics.categories['functional'] || 0;
  const totalCount = data.length;
  const functionalPercentage = (functionalCount / totalCount) * 100;

  if (functionalPercentage < 90) {
    recommendations.push('Consider immediate maintenance for non-functional fixtures to improve lighting quality');
  }

  const overdueFixtures = data.filter(f => 
    f.next_maintenance_date && new Date(f.next_maintenance_date) < new Date()
  );

  if (overdueFixtures.length > 0) {
    recommendations.push(`${overdueFixtures.length} fixtures are overdue for maintenance - schedule immediate inspection`);
  }

  const oldFixtures = data.filter(f => 
    f.installation_date && 
    new Date(f.installation_date) < new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)
  );

  if (oldFixtures.length > data.length * 0.3) {
    recommendations.push('Consider upgrading older fixtures to more energy-efficient LED technology');
  }

  return recommendations;
}