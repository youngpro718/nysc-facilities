import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RoomNote, CreateRoomNoteInput, UpdateRoomNoteInput } from '@/types/roomNotes';
import { useToast } from '@/hooks/use-toast';

export function useRoomNotes(roomId: string | null) {
  return useQuery({
    queryKey: ['room-notes', roomId],
    queryFn: async (): Promise<RoomNote[]> => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('room_notes')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as RoomNote[];
    },
    enabled: !!roomId,
    staleTime: 30_000,
  });
}

export function useActiveRoomNotes(roomId: string | null) {
  return useQuery({
    queryKey: ['room-notes-active', roomId],
    queryFn: async (): Promise<RoomNote[]> => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('room_notes')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_resolved', false)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as RoomNote[];
    },
    enabled: !!roomId,
    staleTime: 30_000,
  });
}

export function useCreateRoomNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateRoomNoteInput) => {
      const { data, error } = await supabase
        .from('room_notes')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as RoomNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['room-notes', data.room_id] });
      queryClient.invalidateQueries({ queryKey: ['room-notes-active', data.room_id] });
      toast({ title: 'Note added', description: 'Room note has been saved.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to add note.', variant: 'destructive' });
      console.error('Error creating room note:', error);
    },
  });
}

export function useUpdateRoomNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, roomId, updates }: { id: string; roomId: string; updates: UpdateRoomNoteInput }) => {
      const updateData: any = { ...updates };
      if (updates.is_resolved) {
        updateData.resolved_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('room_notes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, roomId } as RoomNote & { roomId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['room-notes', data.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-notes-active', data.roomId] });
      toast({ title: 'Note updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update note.', variant: 'destructive' });
      console.error('Error updating room note:', error);
    },
  });
}

export function useDeleteRoomNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, roomId }: { id: string; roomId: string }) => {
      const { error } = await supabase
        .from('room_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, roomId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['room-notes', data.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-notes-active', data.roomId] });
      toast({ title: 'Note deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to delete note.', variant: 'destructive' });
      console.error('Error deleting room note:', error);
    },
  });
}

export function useRecordOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, roomId }: { id: string; roomId: string }) => {
      // First get current count
      const { data: current } = await supabase
        .from('room_notes')
        .select('occurrence_count')
        .eq('id', id)
        .single();

      const newCount = (current?.occurrence_count || 0) + 1;

      const { data, error } = await supabase
        .from('room_notes')
        .update({
          occurrence_count: newCount,
          last_occurrence: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, roomId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['room-notes', data.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-notes-active', data.roomId] });
    },
  });
}
