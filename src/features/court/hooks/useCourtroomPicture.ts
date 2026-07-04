/**
 * useCourtroomPicture — the command dashboard's "is the building ready to
 * hold court" panel data: today's sitting parts from the active term, with
 * courtroom flags (inactive, bunting) and active shutdowns.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentTermId } from "@features/court/utils/currentTerm";
import { sitsOnDay, weekdayName } from "@features/court/utils/commandLogic";
import { formatSittingDays } from "@features/court/utils/termPattern";

export interface CourtroomRow {
  assignmentId: string;
  part: string;
  justice: string;
  roomId: string; // rooms.id — use for issue lookups
  roomNumber: string;
  sittingDays: string; // "Tue/Thu" or "" (sits every day)
  hasBunting: boolean;
  isActive: boolean;
}

export interface ActiveShutdown {
  id: string;
  roomNumber: string;
  title: string | null;
  reason: string | null;
  status: string;
  endDate: string | null;
}

export interface CourtroomPicture {
  isWeekend: boolean;
  today: string; // long weekday name
  sittingToday: CourtroomRow[];
  notSittingToday: CourtroomRow[];
  shutdowns: ActiveShutdown[];
  hasTermData: boolean;
}

export function useCourtroomPicture() {
  return useQuery({
    queryKey: ["command-courtroom-picture"],
    queryFn: async (): Promise<CourtroomPicture> => {
      const today = weekdayName();
      const isWeekend = today === "Saturday" || today === "Sunday";

      const termId = await getCurrentTermId();

      // Courtroom flags, keyed by rooms.id (court_rooms.room_id).
      const { data: courtRooms, error: crErr } = await supabase
        .from("court_rooms")
        .select("id, room_id, room_number, is_active, has_bunting, rooms:room_id(room_number)");
      if (crErr) throw crErr;
      const roomFlags = new Map(
        (courtRooms || []).map((cr: any) => [
          cr.room_id as string,
          {
            courtRoomId: cr.id as string,
            roomNumber: (cr.rooms?.room_number || cr.room_number || "—") as string,
            isActive: !!cr.is_active,
            hasBunting: !!cr.has_bunting,
          },
        ]),
      );
      const byCourtRoomId = new Map(
        (courtRooms || []).map((cr: any) => [
          cr.id as string,
          (cr.rooms?.room_number || cr.room_number || "—") as string,
        ]),
      );

      // Active term assignments.
      let sittingToday: CourtroomRow[] = [];
      let notSittingToday: CourtroomRow[] = [];
      if (termId) {
        const { data: assignments, error: aErr } = await supabase
          .from("court_assignments")
          .select("id, part, justice, room_id, calendar_day, sort_order")
          .eq("term_id", termId)
          .order("sort_order");
        if (aErr) throw aErr;

        // Pair each display row with its sitting-day test so the filter
        // doesn't have to re-find the raw record.
        const paired = (assignments || []).map((a: any) => ({
          sitsToday: sitsOnDay(a.calendar_day ?? null, today),
          row: {
            assignmentId: a.id,
            part: a.part || "—",
            justice: a.justice || "Vacant",
            roomId: a.room_id,
            roomNumber: roomFlags.get(a.room_id as string)?.roomNumber ?? "—",
            sittingDays: formatSittingDays(a.calendar_day),
            hasBunting: roomFlags.get(a.room_id as string)?.hasBunting ?? false,
            isActive: roomFlags.get(a.room_id as string)?.isActive ?? true,
          } satisfies CourtroomRow,
        }));
        sittingToday = paired.filter((p) => p.sitsToday).map((p) => p.row);
        notSittingToday = paired.filter((p) => !p.sitsToday).map((p) => p.row);
      }

      // Active shutdowns (courtroom-scoped table; silent when empty).
      const { data: shutdownRows, error: sErr } = await supabase
        .from("room_shutdowns")
        .select("id, court_room_id, title, reason, status, end_date")
        .in("status", ["scheduled", "in_progress", "delayed"]);
      if (sErr) throw sErr;
      const shutdowns = (shutdownRows || []).map((s: any): ActiveShutdown => ({
        id: s.id,
        roomNumber: byCourtRoomId.get(s.court_room_id as string) ?? "—",
        title: s.title,
        reason: s.reason,
        status: s.status,
        endDate: s.end_date,
      }));

      return { isWeekend, today, sittingToday, notSittingToday, shutdowns, hasTermData: !!termId };
    },
    staleTime: 30_000,
  });
}
