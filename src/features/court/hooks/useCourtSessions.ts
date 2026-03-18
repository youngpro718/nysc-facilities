import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import {
  CourtSession,
  CreateCourtSessionInput,
  UpdateCourtSessionInput,
  SessionPeriod,
  BuildingCode
} from '@/types/courtSessions';
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Fetch court sessions for a specific date, period, and building.
 * 
 * @param date - The date to fetch sessions for
 * @param period - Session period (AM, PM, ALL_DAY)
 * @param buildingCode - Building code (100 or 111)
 * 
 * @returns Query result with sessions including joined court_rooms data
 * 
 * @note Sessions use `court_room_id` which references `court_rooms.id`.
 * The `court_rooms.room_id` field links to the base `rooms` table.
 */

export function useCourtSessions(date: Date, period: SessionPeriod, buildingCode: BuildingCode) {
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['court-sessions', dateStr, period, buildingCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_sessions')
        .select('id, session_date, period, building_code, court_room_id, assignment_id, status, status_detail, estimated_finish_date, judge_name, part_number, clerk_names, sergeant_name, calendar_day, parts_entered_by, defendants, purpose, date_transferred_or_started, top_charge, attorney, calendar_count, calendar_count_date, out_dates, notes, created_by, updated_by, created_at, updated_at')
        .eq('session_date', dateStr)
        .eq('period', period)
        .eq('building_code', buildingCode)
        .limit(100);

      if (error) throw error;

      // Get court rooms separately to avoid schema cache issues
      if (data && data.length > 0) {
        const roomIds = [...new Set(data.map(s => s.court_room_id))];
        const { data: rooms } = await supabase
          .from('court_rooms')
          .select('id, room_number, courtroom_number, room_id')
          .in('id', roomIds);

        // Attach room data to sessions
        const roomsMap = new Map(rooms?.map(r => [r.id, r]) || []);
        return data.map(session => ({
          ...session,
          court_rooms: roomsMap.get(session.court_room_id)
        })) as CourtSession[];
      }

      return data as CourtSession[];
    },
  });
}

export function useCreateCourtSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCourtSessionInput) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Insert first without .select().single() to avoid false errors
      const { error: insertError } = await supabase
        .from('court_sessions')
        .insert({
          ...input,
          created_by: user?.id,
        });

      if (insertError) throw insertError;

      // Row was inserted successfully — now try to fetch it back
      try {
        const { data: inserted } = await supabase
          .from('court_sessions')
          .select('id, session_date, period, building_code, court_room_id, assignment_id, status, status_detail, estimated_finish_date, judge_name, part_number, clerk_names, sergeant_name, calendar_day, parts_entered_by, defendants, purpose, date_transferred_or_started, top_charge, attorney, calendar_count, calendar_count_date, out_dates, notes, created_by, updated_by, created_at, updated_at')
          .eq('session_date', input.session_date)
          .eq('period', input.period)
          .eq('court_room_id', input.court_room_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (inserted?.court_room_id) {
          const { data: room } = await supabase
            .from('court_rooms')
            .select('id, room_number, courtroom_number, room_id')
            .eq('id', inserted.court_room_id)
            .single();
          return { ...inserted, court_rooms: room } as CourtSession;
        }
        return inserted as CourtSession;
      } catch {
        // Insert succeeded but fetch failed — still a success
        return {} as CourtSession;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['court-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['conflict-detection'] });
      queryClient.invalidateQueries({ queryKey: ['existing-sessions-for-create'] });
      toast.success('Session created successfully');
    },
    onError: (error: Error) => {
      logger.error('Error creating session:', error);
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('court_sessions_court_room_id_session_date_period_key') ||
        (msg.includes('duplicate') && msg.includes('court_sessions'))) {
        toast.error('Session already exists', {
          description: 'A session already exists for this courtroom on this date and period. Edit it in the table instead.',
        });
      } else {
        toast.error('Failed to create session', {
          description: error?.message || 'Unknown error',
        });
      }
    },
  });
}

export function useUpdateCourtSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCourtSessionInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { id, ...updates } = input;

      // Remove court_rooms from updates to avoid schema cache issues
      const { court_rooms, ...cleanUpdates } = updates as Record<string, unknown>;

      const { data, error } = await supabase
        .from('court_sessions')
        .update({
          ...cleanUpdates,
          updated_by: user?.id,
        })
        .eq('id', id)
        .select('id, session_date, period, building_code, court_room_id, assignment_id, status, status_detail, estimated_finish_date, judge_name, part_number, clerk_names, sergeant_name, calendar_day, parts_entered_by, defendants, purpose, date_transferred_or_started, top_charge, attorney, calendar_count, calendar_count_date, out_dates, notes, created_by, updated_by, created_at, updated_at')
        .single();

      if (error) throw error;

      // Fetch court room data separately if needed
      if (data && data.court_room_id) {
        const { data: room } = await supabase
          .from('court_rooms')
          .select('id, room_number, courtroom_number, room_id')
          .eq('id', data.court_room_id)
          .single();

        return {
          ...data,
          court_rooms: room
        } as CourtSession;
      }

      return data as CourtSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['court-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['conflict-detection'] });
      toast.success('Session updated successfully');
    },
    onError: (error: Error) => {
      logger.error('Error updating session:', error);
      toast.error('Failed to update session');
    },
  });
}

export function useDeleteCourtSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('court_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['court-sessions'] });
      toast.success('Session deleted successfully');
    },
    onError: (error: Error) => {
      logger.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    },
  });
}

export function useCopyYesterdaySessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fromDate,
      toDate,
      period,
      buildingCode
    }: {
      fromDate: string;
      toDate: string;
      period: SessionPeriod;
      buildingCode: BuildingCode;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch source sessions
      const { data: sourceSessions, error: fetchError } = await supabase
        .from('court_sessions')
        .select('*')
        .eq('session_date', fromDate)
        .eq('period', period)
        .eq('building_code', buildingCode);

      if (fetchError) throw fetchError;
      if (!sourceSessions || sourceSessions.length === 0) {
        throw new Error('No sessions found for the selected date');
      }

      // Create new sessions
      const newSessions = sourceSessions.map(session => ({
        session_date: toDate,
        period: session.period,
        building_code: session.building_code,
        court_room_id: session.court_room_id,
        assignment_id: session.assignment_id,
        status: session.status,
        status_detail: session.status_detail,
        estimated_finish_date: session.estimated_finish_date,
        judge_name: session.judge_name,
        part_number: session.part_number,
        clerk_names: session.clerk_names,
        sergeant_name: session.sergeant_name,
        parts_entered_by: session.parts_entered_by,
        defendants: session.defendants,
        purpose: session.purpose,
        date_transferred_or_started: session.date_transferred_or_started,
        top_charge: session.top_charge,
        attorney: session.attorney,
        calendar_count: session.calendar_count,
        calendar_count_date: session.calendar_count_date,
        out_dates: session.out_dates,
        notes: session.notes,
        created_by: user?.id,
      }));

      const { error: insertError } = await supabase
        .from('court_sessions')
        .insert(newSessions);

      if (insertError) throw insertError;

      return sourceSessions.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['court-sessions'] });
      toast.success(`${count} sessions copied successfully`);
    },
    onError: (error: Error) => {
      logger.error('Error copying sessions:', error);
      toast.error(error.message || 'Failed to copy sessions');
    },
  });
}

/**
 * Copy a single session's data from yesterday (same room) into today's session.
 */
export function useCopySessionFromYesterday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, sessionDate, courtRoomId, period, buildingCode }: {
      sessionId: string;
      sessionDate: string;
      courtRoomId: string;
      period: SessionPeriod;
      buildingCode: BuildingCode;
    }) => {
      // Find yesterday's session for the same room
      const yesterday = new Date(sessionDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      const { data: yesterdaySession, error } = await supabase
        .from('court_sessions')
        .select('status, status_detail, defendants, purpose, date_transferred_or_started, top_charge, attorney, parts_entered_by, calendar_count, calendar_count_date, out_dates, estimated_finish_date, notes')
        .eq('session_date', yesterdayStr)
        .eq('court_room_id', courtRoomId)
        .eq('period', period)
        .eq('building_code', buildingCode)
        .maybeSingle();

      if (error) throw error;
      if (!yesterdaySession) throw new Error('No session found for this room yesterday');

      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('court_sessions')
        .update({
          status: yesterdaySession.status,
          status_detail: yesterdaySession.status_detail,
          defendants: yesterdaySession.defendants,
          purpose: yesterdaySession.purpose,
          date_transferred_or_started: yesterdaySession.date_transferred_or_started,
          top_charge: yesterdaySession.top_charge,
          attorney: yesterdaySession.attorney,
          parts_entered_by: yesterdaySession.parts_entered_by,
          calendar_count: yesterdaySession.calendar_count,
          calendar_count_date: yesterdaySession.calendar_count_date,
          out_dates: yesterdaySession.out_dates,
          estimated_finish_date: yesterdaySession.estimated_finish_date,
          notes: yesterdaySession.notes,
          updated_by: user?.id,
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['court-sessions'] });
      toast.success('Copied from yesterday');
    },
    onError: (error: Error) => {
      logger.error('Error copying from yesterday:', error);
      toast.error(error.message || 'Failed to copy from yesterday');
    },
  });
}

/**
 * Fetch recent sessions for a specific room to power autocomplete and smart defaults.
 */
export function useRecentCourtSessions(courtRoomId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ['recent-sessions', courtRoomId],
    queryFn: async () => {
      if (!courtRoomId) return [];

      const { data, error } = await supabase
        .from('court_sessions')
        .select('id, session_date, status, defendants, top_charge, attorney, purpose')
        .eq('court_room_id', courtRoomId)
        .order('session_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!courtRoomId,
  });
}
