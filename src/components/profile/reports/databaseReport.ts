
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { ReportCallback, DatabaseTable } from "./types";
import { downloadPdf } from "./reportUtils";

export async function fetchFullDatabaseReport(progressCallback: ReportCallback = () => {}) {
  progressCallback({
    status: 'generating',
    progress: 0,
    message: 'Starting database export...'
  });

  // Get list of public tables
  const { data: tables } = await supabase
    .from('information_schema_tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (!tables) throw new Error('No tables found');

  const exportData: Record<string, any[]> = {};
  let currentProgress = 0;
  const progressPerTable = 100 / tables.length;

  // Export data from each table
  for (const { table_name } of tables) {
    progressCallback({
      status: 'generating',
      progress: currentProgress,
      message: `Exporting table: ${table_name}`
    });

    const { data } = await supabase
      .from(table_name)
      .select('*');

    exportData[table_name] = data || [];
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

  downloadPdf(docDefinition, `database_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  return exportData;
}
