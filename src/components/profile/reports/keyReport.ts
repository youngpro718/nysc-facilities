
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { KeyInventoryData } from "./types";
import { downloadPdf } from "./reportUtils";

export async function generateKeyInventoryReport() {
  const { data: stats, error } = await supabase
    .from("key_inventory_view")
    .select(`
      type,
      total_quantity,
      available_quantity,
      active_assignments,
      returned_assignments,
      lost_count
    `);

  if (error) throw error;

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'Key Inventory Report', style: 'header' },
      { text: `Generated on ${format(new Date(), 'PPpp')}`, style: 'subheader' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            ['Type', 'Total', 'Available', 'Active', 'Returned', 'Lost'],
            ...stats.map(row => [
              row.type,
              row.total_quantity.toString(),
              row.available_quantity.toString(),
              row.active_assignments.toString(),
              row.returned_assignments.toString(),
              row.lost_count.toString()
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 0, 0, 5] }
    }
  };

  downloadPdf(docDefinition, `key_inventory_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  return stats;
}

