
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { RoomHealthData } from "./types";
import { downloadPdf } from "./reportUtils";

export async function generateRoomReport() {
  const { data: roomData } = await supabase
    .from("room_health_overview")
    .select("*")
    .returns<RoomHealthData[]>();

  if (!roomData) throw new Error('No room data found');
  
  const content: Content[] = [
    { text: 'Room Health Overview Report', style: 'header' },
    { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
    { text: '\n' },
    ...roomData.map(room => ([
      { text: `Room: ${room.room_name || 'N/A'}`, style: 'roomHeader' },
      {
        text: [
          `Building: ${room.building_name || 'N/A'}\n`,
          `Floor: ${room.floor_name || 'N/A'}\n`,
          `Status: ${room.status || 'N/A'}\n`,
          `Occupancy: ${room.occupancy_status || 'N/A'}\n`,
          `Last Inspection: ${room.last_inspection_date ? format(new Date(room.last_inspection_date), 'PP') : 'N/A'}`
        ]
      },
      { text: '\n' }
    ])).flat()
  ];

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
      roomHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
    }
  };

  downloadPdf(docDefinition, `room_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  return roomData;
}

