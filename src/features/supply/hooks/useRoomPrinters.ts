import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface RoomPrinter {
  id: string;
  room_id: string | null;
  printer_model: string | null;
  toner_code: string | null;
  department: string | null;
  needs_review: boolean;
  inventory_item_id: string | null;
  inventory_item?: {
    id: string;
    name: string;
    sku: string | null;
    unit: string | null;
    quantity: number;
    minimum_quantity: number | null;
    requires_justification: boolean;
    pack_size: number | null;
    order_code_threshold: number | null;
  } | null;
}

/**
 * Fetch printer/toner records for a given room.
 * Joins to inventory_items so callers can add the canonical toner SKU to a
 * supply cart directly (see RoomPrinterToners → OrderCart).
 * Returns [] when roomId is falsy or when the room has no linked printers.
 */
export function useRoomPrinters(roomId?: string | null) {
  return useQuery({
    queryKey: ['room-printers', roomId],
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RoomPrinter[]> => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from('room_printers')
        .select(
          `id, room_id, printer_model, toner_code, department, needs_review, inventory_item_id,
           inventory_item:inventory_items!room_printers_inventory_item_id_fkey (
             id, name, sku, unit, quantity, minimum_quantity, requires_justification,
             pack_size, order_code_threshold
           )`,
        )
        .eq('room_id', roomId);
      if (error) throw error;
      return (data as any as RoomPrinter[]) ?? [];
    },
  });
}

/** Flag a room as having no printers linked so admins can review. */
export async function flagRoomForPrinterAssignment(roomId: string, userId?: string) {
  await supabase
    .from('room_printer_flags')
    .upsert(
      { room_id: roomId, flagged_by: userId ?? null, reason: 'no printers linked' },
      { onConflict: 'room_id', ignoreDuplicates: true },
    );
}
