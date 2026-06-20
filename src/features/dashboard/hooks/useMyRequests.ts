import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';

export interface SupplyRow {
  id: string;
  requester_id: string;
  delivery_location: string | null;
  status: string;
  created_at: string;
  description?: string | null;
  priority?: string | null;
  requested_delivery_date?: string | null;
  approval_notes?: string | null;
  display_id?: string | null;
}

export interface TaskRow {
  id: string;
  created_by: string;
  from_room_id: string | null;
  to_room_id: string | null;
  description: string;
  status: string;
  created_at: string;
  task_type: string | null;
  timing_preference?: string | null;
  requested_for_at?: string | null;
}

export interface KeyRequestRow {
  id: string;
  user_id: string;
  request_type: string;
  room_id: string | null;
  room_other: string | null;
  reason: string;
  quantity: number;
  status: string;
  created_at: string;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  fulfillment_notes?: string | null;
}

export interface MyRequestRow {
  id: string;
  type: 'supply' | 'request' | 'key';
  title: string;
  location_label: string | null;
  status_internal: string;
  created_at: string;
  display_id?: string | null;
  raw: SupplyRow | TaskRow | KeyRequestRow;
}

const truncate = (s: string, n = 60) => (s.length <= n ? s : s.slice(0, n).trimEnd() + '…');

export function mergeRows(
  supplies: SupplyRow[],
  tasks: TaskRow[],
  keyRequests: KeyRequestRow[] = [],
): MyRequestRow[] {
  const supplyRows: MyRequestRow[] = supplies.map((s) => ({
    id: s.id,
    type: 'supply',
    title: s.description?.trim() || 'Supply order',
    location_label: s.delivery_location,
    status_internal: s.status,
    created_at: s.created_at,
    display_id: s.display_id,
    raw: s,
  }));
  const taskRows: MyRequestRow[] = tasks.map((t) => ({
    id: t.id,
    type: 'request',
    title: truncate(t.description || 'Request'),
    location_label: t.from_room_id ?? t.to_room_id,
    status_internal: t.status,
    created_at: t.created_at,
    raw: t,
  }));
  const keyRows: MyRequestRow[] = keyRequests.map((request) => ({
    id: request.id,
    type: 'key',
    title: `${request.request_type.replace(/_/g, ' ')} key request`,
    location_label: request.room_other || request.room_id,
    status_internal: request.status,
    created_at: request.created_at,
    raw: request,
  }));
  return [...supplyRows, ...taskRows, ...keyRows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function useMyRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-requests', user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<MyRequestRow[]> => {
      const [supplyRes, taskRes] = await Promise.all([
        supabase
          .from('supply_requests')
          .select(
            'id, requester_id, delivery_location, status, created_at, description, priority, requested_delivery_date, approval_notes',
          )
          .eq('requester_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('staff_tasks')
          .select('id, created_by, from_room_id, to_room_id, description, status, created_at, task_type, timing_preference, requested_for_at')
          .eq('created_by', user!.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      if (supplyRes.error) throw supplyRes.error;
      if (taskRes.error) throw taskRes.error;
      // NOTE: the key-request workflow (and the key_requests table) was removed.
      // Querying it here used to throw and break this whole page.
      return mergeRows(
        (supplyRes.data ?? []) as SupplyRow[],
        (taskRes.data ?? []) as TaskRow[],
      );
    },
  });
}

export function useMyRequestsRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`my-requests-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'supply_requests', filter: `requester_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['my-requests', user.id] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_tasks', filter: `created_by=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['my-requests', user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
