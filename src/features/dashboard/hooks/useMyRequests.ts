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
  roomLabels: Map<string, string> = new Map(),
  supplyItemSummaries: Map<string, string> = new Map(),
): MyRequestRow[] {
  const supplyRows: MyRequestRow[] = supplies.map((s) => ({
    id: s.id,
    type: 'supply',
    // Lead with what was actually ordered; the order id is metadata, not the headline.
    title:
      supplyItemSummaries.get(s.id) || s.description?.trim() || 'Supply order',
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
    location_label: (() => {
      const roomId = t.from_room_id ?? t.to_room_id;
      return roomId ? roomLabels.get(roomId) ?? roomId : null;
    })(),
    status_internal: t.status,
    created_at: t.created_at,
    raw: t,
  }));
  const keyRows: MyRequestRow[] = keyRequests.map((request) => ({
    id: request.id,
    type: 'key',
    title: `${request.request_type.replace(/_/g, ' ')} key request`,
    location_label: request.room_other
      || (request.room_id ? roomLabels.get(request.room_id) ?? request.room_id : null),
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
      const [supplyRes, taskRes, keyRes] = await Promise.all([
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
        // key_requests may not exist on older deployments; tolerate the
        // missing-table error so the rest of My Requests keeps rendering.
        supabase
          .from('key_requests')
          .select('id, user_id, request_type, room_id, room_other, reason, quantity, status, created_at, admin_notes, rejection_reason, fulfillment_notes')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      if (supplyRes.error) throw supplyRes.error;
      if (taskRes.error) throw taskRes.error;
      const tasks = (taskRes.data ?? []) as TaskRow[];

      const keyRequests: KeyRequestRow[] = keyRes.error
        ? []
        : ((keyRes.data ?? []) as KeyRequestRow[]);

      // Resolve room ids (from staff tasks AND key requests) to readable
      // labels ("Room 1022 · Court Reporter") in a single query.
      const roomIds = Array.from(
        new Set(
          [
            ...tasks.flatMap((t) => [t.from_room_id, t.to_room_id]),
            ...keyRequests.map((k) => k.room_id),
          ].filter(Boolean) as string[],
        ),
      );
      const roomLabels = new Map<string, string>();
      if (roomIds.length > 0) {
        const { data: rooms } = await supabase
          .from('rooms')
          .select('id, name, room_number')
          .in('id', roomIds);
        for (const r of (rooms ?? []) as Array<{ id: string; name: string | null; room_number: string | null }>) {
          const label = [r.room_number ? `Room ${r.room_number}` : null, r.name].filter(Boolean).join(' · ');
          if (label) roomLabels.set(r.id, label);
        }
      }

      // Summarize what each supply order contains ("Batteries (AA) ×4, Pens ×2 +3 more")
      // so rows lead with content instead of a bare "Supply order" + id.
      const supplies = (supplyRes.data ?? []) as SupplyRow[];
      const supplyItemSummaries = new Map<string, string>();
      if (supplies.length > 0) {
        const { data: lineItems } = await supabase
          .from('supply_request_items')
          .select('request_id, quantity_requested, inventory_items(name)')
          .in('request_id', supplies.map((s) => s.id));
        const byRequest = new Map<string, string[]>();
        // PostgREST returns the many-to-one inventory_items join as a single
        // object at runtime, but the client's inferred type says array — go
        // through unknown to assert the runtime shape.
        for (const li of (lineItems ?? []) as unknown as Array<{
          request_id: string;
          quantity_requested: number | null;
          inventory_items: { name: string | null } | null;
        }>) {
          const name = li.inventory_items?.name;
          if (!name) continue;
          const list = byRequest.get(li.request_id) ?? [];
          list.push(li.quantity_requested && li.quantity_requested > 1 ? `${name} ×${li.quantity_requested}` : name);
          byRequest.set(li.request_id, list);
        }
        for (const [requestId, names] of byRequest) {
          const shown = names.slice(0, 2).join(', ');
          const extra = names.length - 2;
          supplyItemSummaries.set(requestId, extra > 0 ? `${shown} +${extra} more` : shown);
        }
      }

      return mergeRows(supplies, tasks, keyRequests, roomLabels, supplyItemSummaries);
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'key_requests', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['my-requests', user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
