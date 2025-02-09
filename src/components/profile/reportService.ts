import { supabase } from "@/integrations/supabase/client";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { format } from 'date-fns';

// Initialize pdfmake with fonts
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

export interface MaintenanceSummary {
  floor_id: string;
  fixtures_needing_maintenance: number;
  non_functional_fixtures: number;
  next_maintenance_due: string | null;
  rooms_under_maintenance: number;
  hallways_under_maintenance: number;
}

export interface FloorplanReportData {
  floor_id: string;
  floor_name: string;
  floor_number: number;
  building_name: string;
  floorplan_data: {
    rooms: Array<{
      id: string;
      name: string;
      room_number: string;
      status: string;
      room_type: string;
      lighting: Array<{
        fixture_id: string;
        position: string;
        fixture_status: string;
        last_maintenance: string;
      }>;
    }>;
    hallways: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      section: string;
      lighting: Array<{
        fixture_id: string;
        position: string;
        fixture_status: string;
        last_maintenance: string;
      }>;
      connections: Array<{
        room_id: string;
        room_name: string;
        connection_type: string;
        position: string;
      }>;
    }>;
  };
}

export const fetchFloorplanReportData = async (): Promise<FloorplanReportData[]> => {
  const { data, error } = await supabase
    .from('floorplan_report_data')
    .select('*');

  if (error) throw error;

  return data.map(floor => ({
    floor_id: floor.floor_id,
    floor_name: floor.floor_name,
    floor_number: floor.floor_number,
    building_name: floor.building_name,
    floorplan_data: typeof floor.floorplan_data === 'string' 
      ? JSON.parse(floor.floorplan_data) 
      : floor.floorplan_data
  }));
};

export async function fetchMaintenanceSummary() {
  const { data, error } = await supabase
    .from('maintenance_summary')
    .select('*');

  if (error) throw error;
  return data;
}

export async function fetchLightingReport() {
  const { data, error } = await supabase
    .from('lighting_fixture_details')
    .select('*');

  if (error) throw error;
  return data;
}

export async function fetchOccupantReport() {
  const { data, error } = await supabase
    .from('occupant_details')
    .select('*');

  if (error) throw error;
  return data;
}

export async function fetchKeyReport() {
  const { data, error } = await supabase
    .from('key_inventory_stats')
    .select('*');

  if (error) throw error;
  return data;
}

export async function fetchRoomReport() {
  const { data, error } = await supabase
    .from('room_occupancy_stats')
    .select('*');

  if (error) throw error;
  return data;
}

export const fetchIssueReport = async () => {
  const { data, error } = await supabase
    .from('issues')
    .select(`
      *,
      buildings(name),
      floors(name),
      rooms(name, room_number)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchFullDatabaseReport = async () => {
  const [
    buildings,
    floors,
    rooms,
    occupants,
    issues,
    keys,
    lighting
  ] = await Promise.all([
    supabase.from('buildings').select('*'),
    supabase.from('floors').select('*'),
    supabase.from('rooms').select('*'),
    supabase.from('occupants').select('*'),
    supabase.from('issues').select('*'),
    supabase.from('keys').select('*'),
    supabase.from('lighting_fixtures').select('*')
  ]);

  return {
    buildings: buildings.data || [],
    floors: floors.data || [],
    rooms: rooms.data || [],
    occupants: occupants.data || [],
    issues: issues.data || [],
    keys: keys.data || [],
    lighting: lighting.data || []
  };
};

interface PDFCellContent {
  text: string;
  style: string;
  margin?: [number, number, number, number];
  alignment?: 'left' | 'center' | 'right';
}

const generateFloorplanContent = (data: FloorplanReportData[]) => {
  const content = [];
  
  content.push({
    text: 'Floorplan Overview',
    style: 'sectionHeader'
  });

  data.forEach((floor) => {
    content.push({
      text: `${floor.building_name} - ${floor.floor_name}`,
      style: 'subHeader',
      margin: [0, 10, 0, 5]
    });

    // Rooms table
    const roomsTableBody = [
      [
        { text: 'Room', style: 'tableHeader' },
        { text: 'Type', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' },
        { text: 'Lighting', style: 'tableHeader' }
      ]
    ];

    floor.floorplan_data.rooms.forEach((room) => {
      roomsTableBody.push([
        { text: `${room.name} (${room.room_number})`, style: 'tableCell' },
        { text: room.room_type, style: 'tableCell' },
        { text: room.status, style: 'tableCell' },
        { text: `${room.lighting?.length || 0} fixtures`, style: 'tableCell' }
      ]);
    });

    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto'],
        body: roomsTableBody
      },
      margin: [0, 0, 0, 15]
    });

    // Hallways table
    const hallwaysTableBody = [
      [
        { text: 'Hallway', style: 'tableHeader' },
        { text: 'Type', style: 'tableHeader' },
        { text: 'Section', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' }
      ]
    ];

    floor.floorplan_data.hallways.forEach((hallway) => {
      hallwaysTableBody.push([
        { text: hallway.name, style: 'tableCell' },
        { text: hallway.type, style: 'tableCell' },
        { text: hallway.section || 'N/A', style: 'tableCell' },
        { text: hallway.status, style: 'tableCell' }
      ]);
    });

    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto'],
        body: hallwaysTableBody
      },
      margin: [0, 0, 0, 20]
    });
  });

  return content;
};

const generateLightingContent = (data: any) => {
  const content = [];
  
  content.push({
    text: 'Lighting Fixtures Overview',
    style: 'sectionHeader'
  });

  const tableBody = [
    [
      { text: 'Fixture Name', style: 'tableHeader' },
      { text: 'Type', style: 'tableHeader' },
      { text: 'Status', style: 'tableHeader' },
      { text: 'Location', style: 'tableHeader' },
      { text: 'Last Maintenance', style: 'tableHeader' }
    ]
  ];

  data.forEach((fixture: any) => {
    tableBody.push([
      { text: fixture.name, style: 'tableCell' },
      { text: fixture.type, style: 'tableCell' },
      { text: fixture.status, style: 'tableCell' },
      { text: `${fixture.building_name} - ${fixture.floor_name}`, style: 'tableCell' },
      { text: fixture.last_maintenance_date || 'Not maintained', style: 'tableCell' }
    ]);
  });

  content.push({
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', '*', 'auto'],
      body: tableBody
    }
  });

  return content;
};

const generateOccupantContent = (data: any) => {
  const content = [];
  
  content.push({
    text: 'Occupant Directory',
    style: 'sectionHeader'
  });

  const tableBody = [
    [
      { text: 'Name', style: 'tableHeader' },
      { text: 'Department', style: 'tableHeader' },
      { text: 'Room Assignment', style: 'tableHeader' },
      { text: 'Access Level', style: 'tableHeader' },
      { text: 'Status', style: 'tableHeader' }
    ]
  ];

  data.forEach((occupant: any) => {
    tableBody.push([
      { text: `${occupant.first_name} ${occupant.last_name}`, style: 'tableCell' },
      { text: occupant.department || 'N/A', style: 'tableCell' },
      { text: occupant.room_names || 'Unassigned', style: 'tableCell' },
      { text: occupant.access_level, style: 'tableCell' },
      { text: occupant.status, style: 'tableCell' }
    ]);
  });

  content.push({
    table: {
      headerRows: 1,
      widths: ['*', 'auto', '*', 'auto', 'auto'],
      body: tableBody
    }
  });

  return content;
};

const generateKeyContent = (data: any) => {
  const content = [];
  
  content.push({
    text: 'Key Inventory Report',
    style: 'sectionHeader'
  });

  const tableBody = [
    [
      { text: 'Key Name', style: 'tableHeader' },
      { text: 'Type', style: 'tableHeader' },
      { text: 'Status', style: 'tableHeader' },
      { text: 'Current Holder', style: 'tableHeader' },
      { text: 'Department', style: 'tableHeader' }
    ]
  ];

  data.forEach((key: any) => {
    tableBody.push([
      { text: key.name, style: 'tableCell' },
      { text: key.type, style: 'tableCell' },
      { text: key.status, style: 'tableCell' },
      { text: key.current_holder || 'Unassigned', style: 'tableCell' },
      { text: key.holder_department || 'N/A', style: 'tableCell' }
    ]);
  });

  content.push({
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', '*', 'auto'],
      body: tableBody
    }
  });

  return content;
};

const generateIssueContent = (data: any) => {
  const content = [];
  
  content.push({
    text: 'Issues Overview',
    style: 'sectionHeader'
  });

  // Add statistics
  const statusCounts = data.reduce((acc: any, issue: any) => {
    acc[issue.status] = (acc[issue.status] || 0) + 1;
    return acc;
  }, {});

  const statsTable = [
    [
      { text: 'Open Issues', style: 'tableHeader' } as PDFCellContent,
      { text: 'In Progress', style: 'tableHeader' } as PDFCellContent,
      { text: 'Resolved', style: 'tableHeader' } as PDFCellContent
    ],
    [
      { text: (statusCounts.open || 0).toString(), style: 'tableCell', alignment: 'center' } as PDFCellContent,
      { text: (statusCounts.in_progress || 0).toString(), style: 'tableCell', alignment: 'center' } as PDFCellContent,
      { text: (statusCounts.resolved || 0).toString(), style: 'tableCell', alignment: 'center' } as PDFCellContent
    ]
  ];

  content.push({
    table: {
      headerRows: 1,
      widths: ['*', '*', '*'],
      body: statsTable
    },
    margin: [0, 0, 0, 20]
  });

  // Add issues table
  const tableBody = [
    [
      { text: 'Title', style: 'tableHeader' } as PDFCellContent,
      { text: 'Type', style: 'tableHeader' } as PDFCellContent,
      { text: 'Status', style: 'tableHeader' } as PDFCellContent,
      { text: 'Priority', style: 'tableHeader' } as PDFCellContent,
      { text: 'Location', style: 'tableHeader' } as PDFCellContent,
      { text: 'Due Date', style: 'tableHeader' } as PDFCellContent
    ]
  ];

  data.forEach((issue: any) => {
    const location = [issue.buildingName, issue.floorName, issue.roomName]
      .filter(Boolean)
      .join(' > ');

    tableBody.push([
      { text: issue.title, style: 'tableCell' } as PDFCellContent,
      { text: issue.type, style: 'tableCell' } as PDFCellContent,
      { text: issue.status, style: 'tableCell' } as PDFCellContent,
      { text: issue.priority, style: 'tableCell' } as PDFCellContent,
      { text: location || 'Unassigned', style: 'tableCell' } as PDFCellContent,
      { text: issue.due_date ? format(new Date(issue.due_date), 'MMM d, yyyy') : 'No due date', style: 'tableCell' } as PDFCellContent
    ]);
  });

  content.push({
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto', '*', 'auto'],
      body: tableBody
    }
  });

  return content;
};

const generateDatabaseContent = (data: any) => {
  const content = [];
  
  content.push({
    text: 'Database Overview',
    style: 'sectionHeader'
  });

  // System Statistics
  const statsTable = [
    [
      { text: 'Category', style: 'tableHeader' } as PDFCellContent,
      { text: 'Count', style: 'tableHeader' } as PDFCellContent
    ],
    ['Buildings', data.buildings.length],
    ['Floors', data.floors.length],
    ['Rooms', data.rooms.length],
    ['Occupants', data.occupants.length],
    ['Active Issues', data.issues.filter((i: any) => i.status !== 'resolved').length],
    ['Keys', data.keys.length],
    ['Lighting Fixtures', data.lighting.length]
  ].map(row => Array.isArray(row) ? [
    { text: row[0], style: 'tableCell' },
    { text: row[1].toString(), style: 'tableCell', alignment: 'center' }
  ] : row);

  content.push({
    table: {
      headerRows: 1,
      widths: ['*', 'auto'],
      body: statsTable
    },
    margin: [0, 0, 0, 20]
  });

  // Buildings Overview
  content.push({
    text: 'Buildings Overview',
    style: 'subHeader',
    margin: [0, 10, 0, 5]
  });

  const buildingsTable = [
    [
      { text: 'Name', style: 'tableHeader' } as PDFCellContent,
      { text: 'Address', style: 'tableHeader' } as PDFCellContent,
      { text: 'Status', style: 'tableHeader' } as PDFCellContent,
      { text: 'Floor Count', style: 'tableHeader' } as PDFCellContent
    ]
  ];

  data.buildings.forEach((building: any) => {
    const floorCount = data.floors.filter((f: any) => f.building_id === building.id).length;
    buildingsTable.push([
      { text: building.name, style: 'tableCell' },
      { text: building.address, style: 'tableCell' },
      { text: building.status, style: 'tableCell' },
      { text: floorCount.toString(), style: 'tableCell', alignment: 'center' }
    ]);
  });

  content.push({
    table: {
      headerRows: 1,
      widths: ['*', '*', 'auto', 'auto'],
      body: buildingsTable
    }
  });

  return content;
};

const generateRoomContent = (data: any) => {
  const content = [];
  
  content.push({
    text: 'Room Occupancy Report',
    style: 'sectionHeader'
  });

  const tableBody = [
    [
      { text: 'Room', style: 'tableHeader' },
      { text: 'Number', style: 'tableHeader' },
      { text: 'Current Occupants', style: 'tableHeader' },
      { text: 'Departments', style: 'tableHeader' },
      { text: 'Status', style: 'tableHeader' }
    ]
  ];

  data.forEach((room: any) => {
    tableBody.push([
      { text: room.room_name, style: 'tableCell' },
      { text: room.room_number, style: 'tableCell' },
      { text: room.current_occupants.toString(), style: 'tableCell' },
      { text: room.departments || 'None', style: 'tableCell' },
      { text: room.occupancy_status, style: 'tableCell' }
    ]);
  });

  content.push({
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', '*', 'auto'],
      body: tableBody
    }
  });

  return content;
};

const generatePDFDefinition = async (data: any, type: string) => {
  const currentDate = format(new Date(), 'MMMM d, yyyy');
  const currentTime = format(new Date(), 'h:mm a');
  const dayOfWeek = format(new Date(), 'EEEE');
  
  // Fetch and convert logo to base64
  const logoResponse = await fetch('/lovable-uploads/ca12c24b-cc46-4318-b46d-8af88c0deae9.png');
  const logoBlob = await logoResponse.blob();
  const logoBase64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(logoBlob);
  });
  
  let content = [];
  
  // Header with courthouse logo and styling
  content.push({
    stack: [
      {
        columns: [
          {
            stack: [
              {
                image: logoBase64 as string,
                width: 60,
                height: 60,
              }
            ],
            width: 'auto'
          },
          {
            stack: [
              {
                text: 'NYSC Facilities Hub',
                style: 'mainHeader',
                alignment: 'center'
              },
              {
                text: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
                style: 'subHeader',
                alignment: 'center'
              },
              {
                text: [
                  `Generated on ${dayOfWeek}, `,
                  `${currentDate} at ${currentTime}`,
                ],
                style: 'dateText',
                alignment: 'center'
              }
            ],
            width: '*'
          },
          {
            stack: [],
            width: 60
          }
        ]
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 2,
            lineColor: '#9b2c2c'
          }
        ]
      }
    ],
    margin: [0, 0, 0, 20]
  });

  switch (type) {
    case 'floorplan':
      content.push(...generateFloorplanContent(data));
      break;
    case 'lighting':
      content.push(...generateLightingContent(data));
      break;
    case 'occupant':
      content.push(...generateOccupantContent(data));
      break;
    case 'key':
      content.push(...generateKeyContent(data));
      break;
    case 'room':
      content.push(...generateRoomContent(data));
      break;
    case 'issue':
      content.push(...generateIssueContent(data));
      break;
    case 'database':
      content.push(...generateDatabaseContent(data));
      break;
  }

  // Footer with page numbers and confidentiality notice
  content.push({
    stack: [
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 2,
            lineColor: '#9b2c2c'
          }
        ]
      },
      {
        columns: [
          {
            text: 'CONFIDENTIAL DOCUMENT',
            style: 'footerText',
            alignment: 'left',
            width: '*'
          },
          {
            text: `Generated by NYSC Facilities Hub`,
            style: 'footerText',
            alignment: 'right',
            width: 'auto'
          }
        ],
        margin: [0, 10, 0, 0]
      }
    ],
    margin: [0, 20, 0, 0]
  });

  return {
    content,
    styles: {
      mainHeader: {
        fontSize: 24,
        bold: true,
        color: '#000000',
        margin: [0, 0, 0, 10]
      },
      subHeader: {
        fontSize: 18,
        color: '#9b2c2c',
        margin: [0, 0, 0, 5]
      },
      dateText: {
        fontSize: 12,
        color: '#666666',
        margin: [0, 0, 0, 10]
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        color: '#000000',
        margin: [0, 15, 0, 10]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: '#ffffff',
        fillColor: '#9b2c2c',
        margin: [0, 5, 0, 5]
      },
      tableCell: {
        fontSize: 11,
        color: '#333333',
        margin: [0, 3, 0, 3]
      },
      footerText: {
        fontSize: 10,
        color: '#666666',
        margin: [0, 5, 0, 0]
      }
    },
    defaultStyle: {
      fontSize: 11,
      color: '#333333'
    },
    pageMargins: [40, 60, 40, 60],
    footer: function(currentPage: number, pageCount: number) {
      return {
        columns: [
          {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: 'center',
            style: 'footerText'
          }
        ],
        margin: [40, 0]
      };
    },
    background: function() {
      return {
        canvas: [
          {
            type: 'rect',
            x: 20,
            y: 20,
            w: 555,
            h: 802,
            lineWidth: 2,
            lineColor: '#9b2c2c',
            dash: { length: 1 }
          }
        ]
      };
    }
  };
};

export const downloadReport = async (data: any, type: string = 'floorplan') => {
  const docDefinition = await generatePDFDefinition(data, type);
  const fileName = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
  
  pdfMake.createPdf(docDefinition).download(fileName);
};

export const generateFullReport = (
  floorplanData: FloorplanReportData[],
  maintenanceData: MaintenanceSummary[]
) => {
  return {
    generated_at: new Date().toISOString(),
    floorplan_data: floorplanData || [],
    maintenance_summary: maintenanceData || [],
  };
};
