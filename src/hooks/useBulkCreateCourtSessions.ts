import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ExtractedSession {
  part_number: string;
  judge_name: string;
  calendar_day?: string;
  clerk_name?: string;
  room_number: string;
  sergeant_name?: string;
  defendants?: string;
  purpose?: string;
  top_charge?: string;
  status?: string;
  attorney?: string;
  estimated_finish_date?: string;
  extension?: string;
  papers?: string;
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
        const courtRoomId = roomMap.get(session.room_number);
        
        if (!courtRoomId) {
          skipped.push({ session, reason: `Room ${session.room_number} not found` });
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
          purpose: session.purpose || null,
          top_charge: session.top_charge || null,
          attorney: session.attorney || null,
          estimated_finish_date: session.estimated_finish_date || null,
          extension: session.extension || null,
          papers: session.papers || null,
          status: 'scheduled',
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
      console.error('Error creating sessions:', error);
      toast.error('Failed to create sessions', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
