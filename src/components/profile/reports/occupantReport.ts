
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { ReportCallback } from "./types";
import { downloadPdf, fetchDataWithProgress } from "./reportUtils";

export async function fetchOccupantReport(progressCallback: ReportCallback = () => {}) {
  const data = await fetchDataWithProgress(
    supabase
      .from('occupants')
      .select(`
        id,
        first_name,
        last_name,
        email,
        department,
        status,
        room_assignments:occupant_room_assignments(rooms(name))
      `),
    progressCallback,
    0,
    50
  );

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'Occupants Report', style: 'header' },
      { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*', '*'],
          body: [
            ['Name', 'Email', 'Department', 'Status', 'Assigned Rooms'],
            ...data.map(occupant => [
              `${occupant.first_name} ${occupant.last_name}`,
              occupant.email,
              occupant.department,
              occupant.status,
              occupant.room_assignments?.map(ra => ra.rooms.name).join(', ') || 'None'
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

  downloadPdf(docDefinition, `occupant_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  return data;
}
