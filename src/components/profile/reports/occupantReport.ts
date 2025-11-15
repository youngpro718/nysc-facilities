import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { ReportCallback, Occupant } from "./types";
import { 
  downloadPdf, 
  fetchDataWithProgress, 
  generateReportHeader, 
  generateMetricsSection,
  generateRecommendationsSection,
  calculateMetrics 
} from "./reportUtils";

export async function fetchOccupantReport(progressCallback: ReportCallback = () => {}) {
  try {
    // Updated query to match actual database schema
    const query = supabase
      .from('occupants')
      .select(`
        id,
        first_name,
        last_name,
        email,
        department,
        status,
        title,
        phone,
        employment_type,
        hire_date,
        occupant_room_assignments!fk_occupant(
          rooms(
            name,
            room_number
          )
        )
      `);
      
    const data = await fetchDataWithProgress<Occupant>(
      query,
      progressCallback,
      0,
      70
    );

    progressCallback({
      status: 'generating',
      progress: 80,
      message: 'Processing occupant data...'
    });

    // Calculate metrics
    const statusMetrics = calculateMetrics(data, (occupant) => occupant.status);
    const departmentMetrics = calculateMetrics(data, (occupant) => occupant.department || 'Unassigned');

    // Generate recommendations
    const recommendations = generateOccupantRecommendations(data);

    progressCallback({
      status: 'generating',
      progress: 90,
      message: 'Generating PDF document...'
    });

    const content: Content[] = [
      ...generateReportHeader('Occupants Report', 'Comprehensive analysis of building occupants and assignments'),
      ...generateMetricsSection(statusMetrics),
      
      // Department breakdown
      { text: 'Department Distribution', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            ['Department', 'Count', 'Percentage'],
            ...Object.entries(departmentMetrics.categories).map(([dept, count]) => [
              dept,
              count.toString(),
              `${((count / data.length) * 100).toFixed(1)}%`
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '\n' },

      // Employment type breakdown
      generateEmploymentTypeAnalysis(data),
      { text: '\n' },

      // Room assignments overview
      generateRoomAssignmentOverview(data),
      { text: '\n' },

      // Detailed occupants table
      { text: 'Occupant Details', style: 'sectionHeader' },
      ...generateOccupantDetailsTable(data),
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

    await downloadPdf(docDefinition, `occupant_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    
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
      message: error instanceof Error ? error.message : 'Failed to generate occupant report'
    });
    throw error;
  }
}

function generateEmploymentTypeAnalysis(data: Occupant[]): Content {
  const employmentTypes = calculateMetrics(data, (occupant) => occupant.employment_type || 'Not Specified');

  return {
    stack: [
      { text: 'Employment Type Analysis', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: [
            ['Employment Type', 'Count'],
            ...Object.entries(employmentTypes.categories).map(([type, count]) => [
              type,
              count.toString()
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      }
    ]
  };
}

function generateRoomAssignmentOverview(data: Occupant[]): Content {
  const withRooms = data.filter(occupant => 
    occupant.occupant_room_assignments && occupant.occupant_room_assignments.length > 0
  );
  const withoutRooms = data.filter(occupant => 
    !occupant.occupant_room_assignments || occupant.occupant_room_assignments.length === 0
  );

  const multipleRooms = data.filter(occupant => 
    occupant.occupant_room_assignments && occupant.occupant_room_assignments.length > 1
  );

  return {
    stack: [
      { text: 'Room Assignment Overview', style: 'sectionHeader' },
      {
        columns: [
          {
            text: [
              { text: `With Room Assignments: ${withRooms.length}\n`, style: 'metric' },
              { text: `Without Rooms: ${withoutRooms.length}\n`, style: 'metric' },
            ]
          },
          {
            text: [
              { text: `Multiple Rooms: ${multipleRooms.length}\n`, style: 'metric' },
              { text: `Assignment Rate: ${((withRooms.length / data.length) * 100).toFixed(1)}%\n`, style: 'metric' },
            ]
          }
        ]
      }
    ]
  };
}

function generateOccupantDetailsTable(data: Occupant[]): Content[] {
  const maxOccupantsPerPage = 20;
  const chunks = [];
  
  for (let i = 0; i < data.length; i += maxOccupantsPerPage) {
    chunks.push(data.slice(i, i + maxOccupantsPerPage));
  }

  return chunks.map((chunk, index) => ({
    table: {
      headerRows: 1,
      widths: ['*', '*', '*', 'auto', '*'],
      body: [
        ['Name', 'Email', 'Department', 'Status', 'Assigned Rooms'],
        ...chunk.map(occupant => [
          `${occupant.first_name} ${occupant.last_name}`,
          occupant.email,
          occupant.department || 'N/A',
          occupant.status,
          occupant.occupant_room_assignments?.map(assignment => 
            `${assignment.rooms.name} (${assignment.rooms.room_number})`
          ).join(', ') || 'None'
        ])
      ]
    },
    layout: 'lightHorizontalLines',
    pageBreak: index < chunks.length - 1 ? 'after' : undefined
  }));
}

function generateOccupantRecommendations(data: Occupant[]): string[] {
  const recommendations: string[] = [];

  const unassignedOccupants = data.filter(occupant => 
    !occupant.occupant_room_assignments || occupant.occupant_room_assignments.length === 0
  );

  if (unassignedOccupants.length > 0) {
    recommendations.push(`${unassignedOccupants.length} occupants have no room assignments - review space allocation`);
  }

  const inactiveOccupants = data.filter(occupant => occupant.status === 'inactive');
  if (inactiveOccupants.length > data.length * 0.1) {
    recommendations.push('High percentage of inactive occupants - consider archiving or updating status');
  }

  const missingDepartments = data.filter(occupant => !occupant.department);
  if (missingDepartments.length > 0) {
    recommendations.push(`${missingDepartments.length} occupants have no department assigned - update department information`);
  }

  const missingContact = data.filter(occupant => !occupant.email || !occupant.phone);
  if (missingContact.length > 0) {
    recommendations.push(`${missingContact.length} occupants have incomplete contact information`);
  }

  const multipleRoomOccupants = data.filter(occupant => 
    occupant.occupant_room_assignments && occupant.occupant_room_assignments.length > 2
  );

  if (multipleRoomOccupants.length > 0) {
    recommendations.push(`${multipleRoomOccupants.length} occupants have more than 2 room assignments - verify necessity`);
  }

  return recommendations;
}