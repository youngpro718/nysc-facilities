import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface RoomPrinter {
  id: string;
  room_id: string | null;
  printer_model: string | null;
  toner_code: string | null;
  department: string | null;
  needs_review: boolean;
}

/**
 * Fetch printer/toner records for a given room.
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
        .select('id, room_id, printer_model, toner_code, department, needs_review')
        .eq('room_id', roomId);
      if (error) throw error;
      return (data as RoomPrinter[]) ?? [];
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
