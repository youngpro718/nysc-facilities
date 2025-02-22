
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { ReportCallback } from "./types";
import { downloadPdf } from "./reportUtils";

export async function fetchFullDatabaseReport(progressCallback: ReportCallback = () => {}) {
  progressCallback({
    status: 'generating',
    progress: 0,
    message: 'Starting database export...'
  });

  // Get tables list
  const { data: tables } = await supabase
    .from('information_schema.tables')
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

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'Full Database Export', style: 'header' },
      { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
      ...Object.entries(exportData).map(([tableName, data]) => [
        { text: `\nTable: ${tableName}`, style: 'tableHeader' },
        {
          table: {
            headerRows: 1,
            widths: data[0] ? Array(Object.keys(data[0]).length).fill('*') : ['*'],
            body: [
              data[0] ? Object.keys(data[0]) : ['No data'],
              ...data.map(row => Object.values(row))
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ]).flat()
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
      tableHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
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
