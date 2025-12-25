import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ChildRoom {
  id: string;
  name: string;
  room_number: string | null;
  room_type: string;
  status: string;
}

export function useChildRooms(parentRoomId: string | null) {
  return useQuery({
    queryKey: ['child-rooms', parentRoomId],
    queryFn: async (): Promise<ChildRoom[]> => {
      if (!parentRoomId) return [];

      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, room_number, room_type, status')
        .eq('parent_room_id', parentRoomId)
        .order('room_number', { ascending: true });

      if (error) throw error;
      return (data || []) as ChildRoom[];
    },
    enabled: !!parentRoomId,
    staleTime: 60_000,
  });
}

export function useChildRoomCount(parentRoomId: string | null) {
  return useQuery({
    queryKey: ['child-room-count', parentRoomId],
    queryFn: async (): Promise<number> => {
      if (!parentRoomId) return 0;

      const { count, error } = await supabase
        .from('rooms')
        .select('id', { count: 'exact', head: true })
        .eq('parent_room_id', parentRoomId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!parentRoomId,
    staleTime: 60_000,
  });
}
