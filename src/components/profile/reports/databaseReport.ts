
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { ReportCallback } from "./types";
import { downloadPdf } from "./reportUtils";

const ALLOWED_TABLES = [
  'buildings',
  'floors',
  'rooms',
  'lighting_fixtures',
  'issues',
  'occupants'
] as const;

// Limit rows per table to prevent PDF generation timeout
const MAX_ROWS_PER_TABLE = 50;

// Define key columns for each table to reduce PDF complexity
const TABLE_KEY_COLUMNS: Record<string, string[]> = {
  buildings: ['name', 'address', 'status', 'created_at'],
  floors: ['name', 'floor_number', 'building_id', 'status'],
  rooms: ['name', 'room_number', 'room_type', 'status', 'current_occupancy'],
  lighting_fixtures: ['name', 'fixture_type', 'status', 'room_id', 'last_maintenance'],
  issues: ['title', 'status', 'priority', 'category', 'created_at'],
  occupants: ['first_name', 'last_name', 'email', 'status', 'department']
};

type AllowedTable = typeof ALLOWED_TABLES[number];

export async function fetchFullDatabaseReport(progressCallback: ReportCallback = () => {}) {
  progressCallback({
    status: 'generating',
    progress: 0,
    message: 'Starting database export...'
  });

  const exportData: Record<string, any[]> = {};
  const dataSizeWarnings: string[] = [];
  let currentProgress = 0;
  const progressPerTable = 100 / ALLOWED_TABLES.length;

  // Export data from each table with optimizations
  for (const tableName of ALLOWED_TABLES) {
    progressCallback({
      status: 'generating',
      progress: currentProgress,
      message: `Fetching ${tableName} data (max ${MAX_ROWS_PER_TABLE} rows)...`
    });

    const keyColumns = TABLE_KEY_COLUMNS[tableName] || ['*'];
    const selectColumns = keyColumns.join(', ');

    // First get count to warn about large datasets
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (count && count > MAX_ROWS_PER_TABLE) {
      dataSizeWarnings.push(`${tableName}: ${count} records (showing first ${MAX_ROWS_PER_TABLE})`);
    }

    // Fetch limited data with only key columns
    const { data } = await supabase
      .from(tableName)
      .select(selectColumns)
      .limit(MAX_ROWS_PER_TABLE)
      .order('created_at', { ascending: false, nullsFirst: false });

    exportData[tableName] = data || [];
    currentProgress += progressPerTable;
  }

  const content: Content[] = [
    { text: 'Database Export Summary', style: 'header' },
    { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' }
  ];

  // Add data size warnings if any
  if (dataSizeWarnings.length > 0) {
    content.push(
      { text: '\nData Size Limitations', style: 'warningHeader' },
      { text: 'Some tables have been limited to improve PDF generation performance:', style: 'warning' },
      { ul: dataSizeWarnings.map(warning => ({ text: warning, style: 'warningItem' })) },
      { text: 'For complete data, export individual tables or use CSV format.\n', style: 'warning' }
    );
  }

  // Calculate total records
  const totalRecords = Object.values(exportData).reduce((sum, data) => sum + data.length, 0);
  content.push(
    { text: `\nSummary: ${totalRecords} total records across ${ALLOWED_TABLES.length} tables\n`, style: 'summary' }
  );

  // Add table data to content with optimized layout
  Object.entries(exportData).forEach(([tableName, data]) => {
    content.push({ text: `\nTable: ${tableName.toUpperCase()}`, style: 'tableHeader' });
    content.push({ text: `Records: ${data.length}`, style: 'tableSubheader' });
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const maxCols = 6; // Limit columns to prevent wide tables
      const displayHeaders = headers.slice(0, maxCols);
      
      if (headers.length > maxCols) {
        displayHeaders.push('...');
      }

      content.push({
        table: {
          headerRows: 1,
          widths: Array(displayHeaders.length).fill('*'),
          body: [
            displayHeaders,
            ...data.slice(0, 10).map(row => { // Show max 10 rows per table
              const values = Object.values(row);
              const displayValues = values.slice(0, maxCols).map(val => 
                val === null || val === undefined ? '' : String(val).substring(0, 50)
              );
              if (headers.length > maxCols) {
                displayValues.push('...');
              }
              return displayValues;
            })
          ]
        },
        layout: 'lightHorizontalLines'
      });
      
      if (data.length > 10) {
        content.push({ text: `... and ${data.length - 10} more records`, style: 'moreRecords' });
      }
    } else {
      content.push({ text: 'No data available', style: 'tableContent' });
    }
  });

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
      summary: { fontSize: 12, bold: true, margin: [0, 5, 0, 10], color: '#059669' },
      warningHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5], color: '#ea580c' },
      warning: { fontSize: 11, margin: [0, 2, 0, 2], color: '#ea580c' },
      warningItem: { fontSize: 10, margin: [0, 1, 0, 1], color: '#ea580c' },
      tableHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 3], color: '#1e40af' },
      tableSubheader: { fontSize: 11, margin: [0, 0, 0, 5], color: '#64748b' },
      tableContent: { fontSize: 10, margin: [0, 5, 0, 5] },
      moreRecords: { fontSize: 10, italics: true, margin: [0, 3, 0, 8], color: '#64748b' }
    }
  };

  progressCallback({
    status: 'completed',
    progress: 100,
    message: 'Database export completed'
  });

  // Return the document definition instead of calling downloadPdf directly
  return docDefinition;
}
