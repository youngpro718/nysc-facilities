import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { LockboxSlot, LockboxWithSlotCount } from "../types/LockboxTypes";
import { format } from "date-fns";

interface PrintLockboxReferenceProps {
  lockbox: LockboxWithSlotCount;
  slots: LockboxSlot[];
}

export function PrintLockboxReference({ lockbox, slots }: PrintLockboxReferenceProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const statusLabel = (s: string) => {
      switch (s) {
        case 'in_box': return 'In Box';
        case 'checked_out': return 'Checked Out';
        case 'missing': return 'Missing';
        case 'retired': return 'Retired';
        default: return s;
      }
    };

    const rows = slots.map(slot => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #ddd;text-align:center;font-weight:600">${slot.slot_number}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #ddd">${slot.label}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #ddd">${slot.room_number || '—'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #ddd;text-align:center">${statusLabel(slot.status)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #ddd;text-align:center">${slot.quantity > 1 ? slot.quantity : '1'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${lockbox.name} - Key Reference</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #222; }
          h1 { font-size: 20px; margin: 0 0 4px 0; }
          .meta { color: #666; font-size: 13px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #f5f5f5; padding: 8px 10px; text-align: left; border-bottom: 2px solid #ccc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          th:first-child, th:nth-child(4), th:nth-child(5) { text-align: center; }
          .footer { margin-top: 20px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
        </style>
      </head>
      <body>
        <h1>${lockbox.name}</h1>
        <div class="meta">
          ${lockbox.location_description ? `<div>Location: ${lockbox.location_description}</div>` : ''}
          <div>Printed: ${format(new Date(), 'MMM d, yyyy h:mm a')}</div>
          <div>${slots.length} total slots · ${slots.filter(s => s.status === 'in_box').length} available · ${slots.filter(s => s.status === 'checked_out').length} checked out</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:50px">Slot</th>
              <th>Label</th>
              <th>Room</th>
              <th style="width:90px">Status</th>
              <th style="width:50px">Qty</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">Key Reference — ${lockbox.name}</div>
        <script>window.print();window.onafterprint=()=>window.close();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Button variant="outline" size="icon" onClick={handlePrint} title="Print key reference">
      <Printer className="h-4 w-4" />
    </Button>
  );
}
