// @ts-nocheck
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { RoomHealthData, ReportCallback } from "./types";
import { 
  downloadPdf, 
  generateReportHeader, 
  generateMetricsSection,
  generateRecommendationsSection,
  calculateMetrics 
} from "./reportUtils";

export async function generateRoomReport(progressCallback: ReportCallback = () => {}) {
  try {
    progressCallback({
      status: 'generating',
      progress: 10,
      message: 'Fetching room data...'
    });

    const { data: roomData, error } = await supabase
      .from("room_health_overview")
      .select("*");

    if (error) {
      progressCallback({
        status: 'error',
        progress: 10,
        message: `Database error: ${error.message}`
      });
      throw error;
    }

    if (!roomData || roomData.length === 0) {
      progressCallback({
        status: 'generating',
        progress: 50,
        message: 'No room data found, generating empty report'
      });
    }

    progressCallback({
      status: 'generating',
      progress: 60,
      message: `Processing ${roomData?.length || 0} rooms...`
    });

    const data = roomData || [];

    // Calculate metrics based on available data
    const healthMetrics = calculateMetrics(data, (room) => 
      room.health_score && room.health_score > 80 ? 'Good' : 
      room.health_score && room.health_score > 60 ? 'Fair' : 'Poor'
    );
    const issueMetrics = calculateMetrics(data, (room) => 
      room.critical_issues_count && room.critical_issues_count > 0 ? 'Has Critical Issues' : 'No Critical Issues'
    );

    // Generate recommendations
    const recommendations = generateRoomRecommendations(data as any);

    progressCallback({
      status: 'generating',
      progress: 80,
      message: 'Generating PDF document...'
    });

    const content: Content[] = [
      ...generateReportHeader('Room Health Overview Report', 'Comprehensive analysis of room conditions and health scores'),
      ...generateMetricsSection(healthMetrics),
      
      // Issue distribution
      { text: 'Room Issue Status Distribution', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            ['Issue Status', 'Count', 'Percentage'],
            ...Object.entries(issueMetrics.categories).map(([status, count]) => [
              status,
              count.toString(),
              `${((count / data.length) * 100).toFixed(1)}%`
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '\n' },

      // Health score analysis
      generateHealthScoreAnalysis(data),
      { text: '\n' },

      // Room details
      { text: 'Room Details', style: 'sectionHeader' },
      ...generateRoomDetailsTable(data as any),
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

    await downloadPdf(docDefinition, `room_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    
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
      message: error instanceof Error ? error.message : 'Failed to generate room report'
    });
    throw error;
  }
}

function generateHealthScoreAnalysis(data: any[]): Content {
  const avgHealthScore = data.reduce((sum, room) => sum + (room.health_score || 0), 0) / data.length;
  const criticalRooms = data.filter(room => (room.critical_issues_count || 0) > 0);

  return {
    stack: [
      { text: 'Health Score Analysis', style: 'sectionHeader' },
      { text: `Average Health Score: ${avgHealthScore.toFixed(1)}`, style: 'metric' },
      { text: `Rooms with Critical Issues: ${criticalRooms.length}`, style: 'metric' },
      { text: '\n' }
    ]
  };
}

function generateRoomDetailsTable(data: any[]): Content[] {
  const maxRoomsPerPage = 15;
  const chunks = [];
  
  for (let i = 0; i < data.length; i += maxRoomsPerPage) {
    chunks.push(data.slice(i, i + maxRoomsPerPage));
  }

  return chunks.map((chunk, index) => ({
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto', '*'],
      body: [
        ['Room', 'Health Score', 'Critical Issues', 'Open Issues', 'Next Maintenance'],
        ...chunk.map(room => [
          `${room.room_name || 'N/A'} (${room.room_number || 'N/A'})`,
          room.health_score ? room.health_score.toString() : 'N/A',
          room.critical_issues_count ? room.critical_issues_count.toString() : '0',
          room.open_issues_count ? room.open_issues_count.toString() : '0',
          room.next_maintenance_due ? 
            format(new Date(room.next_maintenance_due), 'PP') : 'N/A'
        ])
      ]
    },
    layout: 'lightHorizontalLines',
    pageBreak: index < chunks.length - 1 ? 'after' : undefined
  }));
}

function generateRoomRecommendations(data: any[]): string[] {
  const recommendations: string[] = [];
  
  const lowHealthRooms = data.filter(room => (room.health_score || 0) < 60);
  if (lowHealthRooms.length > 0) {
    recommendations.push(`${lowHealthRooms.length} rooms have low health scores (<60) - schedule inspections and maintenance`);
  }

  const criticalIssueRooms = data.filter(room => (room.critical_issues_count || 0) > 0);
  if (criticalIssueRooms.length > 0) {
    recommendations.push(`${criticalIssueRooms.length} rooms have critical issues - address immediately`);
  }

  const overdueMaintenance = data.filter(room => {
    if (!room.next_maintenance_due) return false;
    return new Date(room.next_maintenance_due) < new Date();
  });

  if (overdueMaintenance.length > 0) {
    recommendations.push(`${overdueMaintenance.length} rooms are overdue for maintenance`);
  }

  const avgHealthScore = data.reduce((sum, room) => sum + (room.health_score || 0), 0) / data.length;
  if (avgHealthScore < 70) {
    recommendations.push('Overall room health score is below 70 - implement comprehensive maintenance program');
  }

  return recommendations;
}