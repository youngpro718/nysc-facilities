import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useCourtSessions(date: Date, period: SessionPeriod, buildingCode: BuildingCode) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['court-sessions', dateStr, period, buildingCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_sessions')
        .select('*')
        .eq('session_date', dateStr)
        .eq('period', period)
        .eq('building_code', buildingCode);
      
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

      const { data, error } = await supabase
        .from('court_sessions')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select('id, session_date, period, building_code, court_room_id, assignment_id, status, status_detail, estimated_finish_date, judge_name, part_number, clerk_names, sergeant_name, calendar_day, parts_entered_by, defendants, purpose, date_transferred_or_started, top_charge, attorney, notes, created_by, updated_by, created_at, updated_at')
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
      toast.success('Session created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
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
      const { court_rooms, ...cleanUpdates } = updates as any;

      const { data, error } = await supabase
        .from('court_sessions')
        .update({
          ...cleanUpdates,
          updated_by: user?.id,
        })
        .eq('id', id)
        .select('id, session_date, period, building_code, court_room_id, assignment_id, status, status_detail, estimated_finish_date, judge_name, part_number, clerk_names, sergeant_name, calendar_day, parts_entered_by, defendants, purpose, date_transferred_or_started, top_charge, attorney, notes, created_by, updated_by, created_at, updated_at')
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
      console.error('Error updating session:', error);
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
      console.error('Error deleting session:', error);
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
      console.error('Error copying sessions:', error);
      toast.error(error.message || 'Failed to copy sessions');
    },
  });
}
