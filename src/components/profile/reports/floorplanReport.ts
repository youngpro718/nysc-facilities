
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Content, TDocumentDefinitions, TableCell } from "pdfmake/interfaces";
import { FloorplanReportData, ReportCallback } from "./types";
import { downloadPdf } from "./reportUtils";

export async function fetchFloorplanReportData(progressCallback: ReportCallback = () => {}) {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select(`
        id,
        name,
        floors:floors(
          id,
          name,
          rooms:rooms(
            id,
            name,
            room_type,
            status,
            maintenance_history,
            next_maintenance_date
          )
        )
      `);

    if (error) throw error;
    if (!data) throw new Error('No data found');

    const transformedData: FloorplanReportData[] = data.map(building => ({
      id: building.id,
      name: building.name,
      floors: (building.floors || []).map(floor => ({
        id: floor.id,
        name: floor.name,
        rooms: (floor.rooms || []).map(room => ({
          id: room.id,
          name: room.name,
          type: room.room_type,
          status: room.status,
          maintenance_history: room.maintenance_history || [],
          next_maintenance_date: room.next_maintenance_date
        }))
      }))
    }));

    const docContent: Content[] = [
      { text: 'Floorplan Report', style: 'header' },
      { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
      { text: '\n' },
      ...transformedData.map(building => [
        { text: building.name, style: 'buildingHeader' },
        ...(building.floors || []).map(floor => [
          { text: floor.name, style: 'floorHeader' },
          {
            table: {
              headerRows: 0,
              widths: ['*'],
              body: floor.rooms.map(room => [[
                { text: `${room.name} - ${room.type} (${room.status})`, style: 'roomItem' }
              ]])
            } as { widths: string[]; body: TableCell[][] },
            layout: 'noBorders',
            margin: [10, 0, 0, 0] as [number, number, number, number]
          } as Content,
          { text: '\n' }
        ]).flat()
      ]).flat()
    ];

    const docDefinition: TDocumentDefinitions = {
      content: docContent,
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
        buildingHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
        floorHeader: { fontSize: 14, bold: true, margin: [0, 5, 0, 5] },
        roomList: { margin: [10, 0, 0, 0] as [number, number, number, number] },
        roomItem: { fontSize: 12 }
      }
    };

    downloadPdf(docDefinition, `floorplan_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    return transformedData;
  } catch (error) {
    console.error('Error fetching floorplan report data:', error);
    throw error;
  }
}

