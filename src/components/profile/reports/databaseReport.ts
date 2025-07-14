
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

type AllowedTable = typeof ALLOWED_TABLES[number];

export async function fetchFullDatabaseReport(progressCallback: ReportCallback = () => {}) {
  progressCallback({
    status: 'generating',
    progress: 0,
    message: 'Starting database export...'
  });

  const exportData: Record<string, any[]> = {};
  let currentProgress = 0;
  const progressPerTable = 100 / ALLOWED_TABLES.length;

  // Export data from each table
  for (const tableName of ALLOWED_TABLES) {
    progressCallback({
      status: 'generating',
      progress: currentProgress,
      message: `Exporting table: ${tableName}`
    });

    const { data } = await supabase
      .from(tableName)
      .select('*');

    exportData[tableName] = data || [];
    currentProgress += progressPerTable;
  }

  const content: Content[] = [
    { text: 'Full Database Export', style: 'header' },
    { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' }
  ];

  // Add table data to content
  Object.entries(exportData).forEach(([tableName, data]) => {
    content.push({ text: `\nTable: ${tableName}`, style: 'tableHeader' });
    if (data.length > 0) {
      content.push({
        table: {
          headerRows: 1,
          widths: Array(Object.keys(data[0]).length).fill('*'),
          body: [
            Object.keys(data[0]),
            ...data.map(row => Object.values(row))
          ]
        },
        layout: 'lightHorizontalLines'
      });
    } else {
      content.push({ text: 'No data', style: 'tableContent' });
    }
  });

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
      tableHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      tableContent: { fontSize: 12, margin: [0, 5, 0, 5] }
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
