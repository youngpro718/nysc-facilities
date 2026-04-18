import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getErrorMessage } from '@/lib/errorUtils';

/**
 * Convert a short PDF date (e.g. "2/23", "3/16", "3/16H") to YYYY-MM-DD
 * using the session year as context. Returns null if the input is not a valid short date.
 */
function toFullDate(shortDate: string | null | undefined, sessionYear: number): string | null {
  if (!shortDate) return null;
  // Strip trailing letters like "H" (half-day indicator)
  const cleaned = shortDate.replace(/[A-Za-z]+$/, '').trim();
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const month = match[1].padStart(2, '0');
  const day = match[2].padStart(2, '0');
  return `${sessionYear}-${month}-${day}`;
}

interface ExtractedSession {
  part_number: string;
  judge_name: string;
  calendar_day?: string;
  clerk_name?: string;
  room_number?: string;
  court_room_id?: string;
  sergeant_name?: string;
  defendants?: string;
  parts_entered_by?: string;
  purpose?: string;
  date_transferred_or_started?: string | null;
  top_charge?: string;
  status?: string;
  status_detail?: string | null;
  attorney?: string;
  estimated_finish_date?: string | null;
  extension?: string;
  papers?: string;
  out_dates?: string[];
  calendar_count?: number | null;
  calendar_count_date?: string | null;
}

interface BulkCreateParams {
  sessions: ExtractedSession[];
  date: Date;
  period: 'AM' | 'PM' | 'ALL_DAY';
  buildingCode: '100' | '111';
}

/**
 * Hook to bulk create court sessions from extracted PDF data
 * Maps extracted session data to court_sessions table format
 */
export function useBulkCreateCourtSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessions, date, period, buildingCode }: BulkCreateParams) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get all court rooms for mapping room_number -> court_room_id
      const { data: courtRooms, error: roomsError } = await supabase
        .from('court_rooms')
        .select('id, room_number');

      if (roomsError) throw roomsError;

      const roomMap = new Map(courtRooms?.map(r => [r.room_number, r.id]) || []);
      const dateStr = format(date, 'yyyy-MM-dd');
      const sessionYear = date.getFullYear();

      // Check for existing sessions to avoid duplicates
      const { data: existingSessions } = await supabase
        .from('court_sessions')
        .select('part_number, court_room_id')
        .eq('session_date', dateStr)
        .eq('period', period)
        .eq('building_code', buildingCode);

      const existingParts = new Set(existingSessions?.map(s => s.part_number) || []);
      const existingRoomIds = new Set(existingSessions?.map(s => s.court_room_id) || []);

      // Prepare sessions for insert, filtering out duplicates
      const sessionsToInsert = [];
      const skipped = [];

      for (const session of sessions) {
        const courtRoomId = session.court_room_id || roomMap.get(session.room_number ?? '');
        
        if (!courtRoomId) {
          skipped.push({ session, reason: `Room ${session.room_number || '(unknown)'} not found` });
          continue;
        }

        // Skip if this part already exists for this date/period
        if (session.part_number && existingParts.has(session.part_number)) {
          skipped.push({ session, reason: `Part ${session.part_number} already exists` });
          continue;
        }

        // Skip if this room already has a session for this period
        if (existingRoomIds.has(courtRoomId)) {
          skipped.push({ session, reason: `Room ${session.room_number} already has a session` });
          continue;
        }

        sessionsToInsert.push({
          session_date: dateStr,
          period,
          building_code: buildingCode,
          court_room_id: courtRoomId,
          part_number: session.part_number || null,
          judge_name: session.judge_name || null,
          calendar_day: session.calendar_day || null,
          clerk_names: session.clerk_name ? [session.clerk_name] : null,
          sergeant_name: session.sergeant_name || null,
          defendants: session.defendants || null,
          parts_entered_by: session.parts_entered_by || null,
          purpose: session.purpose || null,
          date_transferred_or_started: toFullDate(session.date_transferred_or_started, sessionYear),
          top_charge: session.top_charge || null,
          status: 'CALENDAR',
          status_detail: session.status_detail || null,
          attorney: session.attorney || null,
          estimated_finish_date: toFullDate(session.estimated_finish_date, sessionYear),
          extension: session.extension || null,
          papers: session.papers || null,
          out_dates: session.out_dates?.length ? session.out_dates : null,
          calendar_count: session.calendar_count ?? null,
          calendar_count_date: toFullDate(session.calendar_count_date, sessionYear),
          created_by: user.id,
        });
      }

      if (sessionsToInsert.length === 0) {
        return { inserted: 0, skipped: skipped.length, skippedDetails: skipped };
      }

      // Bulk insert
      const { data, error } = await supabase
        .from('court_sessions')
        .insert(sessionsToInsert)
        .select();

      if (error) throw error;

      return {
        inserted: data?.length || 0,
        skipped: skipped.length,
        skippedDetails: skipped,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['court-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['court-operations'] });
      
      if (result.skipped > 0) {
        toast.success(`Created ${result.inserted} sessions`, {
          description: `${result.skipped} sessions skipped (duplicates or missing rooms)`,
        });
      } else {
        toast.success(`Successfully created ${result.inserted} sessions`);
      }
    },
    onError: (error) => {
      logger.error('Error creating sessions:', error);
      toast.error('Failed to create sessions', {
        description: getErrorMessage(error),
      });
    },
  });
}
