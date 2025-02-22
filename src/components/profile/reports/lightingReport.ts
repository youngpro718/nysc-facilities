
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { ReportCallback } from "./types";
import { downloadPdf, fetchDataWithProgress } from "./reportUtils";

export async function fetchLightingReport(progressCallback: ReportCallback = () => {}) {
  const data = await fetchDataWithProgress(
    supabase
      .from('lighting_fixtures')
      .select(`
        id,
        name,
        type,
        status,
        maintenance_history,
        zone:lighting_zones(name)
      `),
    progressCallback,
    0,
    50
  );

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'Lighting Fixtures Report', style: 'header' },
      { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*'],
          body: [
            ['Name', 'Type', 'Status', 'Zone'],
            ...data.map(fixture => [
              fixture.name,
              fixture.type,
              fixture.status,
              fixture.zone?.name || 'N/A'
            ])
          ]
        }
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] }
    }
  };

  downloadPdf(docDefinition, `lighting_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  return data;
}
