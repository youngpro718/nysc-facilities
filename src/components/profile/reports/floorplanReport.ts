
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Content, TDocumentDefinitions, TableCell } from "pdfmake/interfaces";
import { FloorplanReportData, ReportCallback } from "./types";
import { downloadPdf } from "./reportUtils";

export async function fetchFloorplanReportData(progressCallback: ReportCallback = () => {}) {
  try {
    progressCallback({
      status: 'generating',
      progress: 0,
      message: 'Fetching floorplan data...'
    });

    const { data, error } = await supabase
      .from('buildings')
      .select(`
        id,
        name,
        floors:floors(
          id,
          name
        )
      `);

    if (error) throw error;
    if (!data) throw new Error('No data found');

    progressCallback({
      status: 'generating',
      progress: 50,
      message: 'Processing floorplan data...'
    });

    const reportData: FloorplanReportData[] = data.flatMap(building => 
      (building.floors || []).map(floor => ({
        building_name: building.name,
        floor_name: floor.name,
        floor_id: floor.id,
        floorplan_data: {
          building_id: building.id,
          floor_details: floor
        }
      }))
    );

    const docContent: Content[] = [
      { text: 'Floorplan Report', style: 'header' },
      { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
      { text: '\n' },
      ...reportData.map(data => [
        { text: `${data.building_name} - ${data.floor_name}`, style: 'sectionHeader' },
        {
          table: {
            headerRows: 0,
            widths: ['*'],
            body: [[
              { text: `Floor: ${data.floor_name} in ${data.building_name}`, style: 'content' }
            ]]
          } as { widths: string[]; body: TableCell[][] },
          layout: 'noBorders',
          margin: [10, 0, 0, 0] as [number, number, number, number]
        } as Content,
        { text: '\n' }
      ]).flat()
    ];

    const docDefinition: TDocumentDefinitions = {
      content: docContent,
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] },
        sectionHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
        content: { fontSize: 12 }
      }
    };

    progressCallback({
      status: 'completed',
      progress: 100,
      message: 'Floorplan report generated successfully'
    });

    downloadPdf(docDefinition, `floorplan_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    return reportData;
  } catch (error) {
    console.error('Error fetching floorplan report data:', error);
    throw error;
  }
}
