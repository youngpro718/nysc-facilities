import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserRoomAssignments } from '@features/spaces/hooks/useUserRoomAssignments';

export interface DeliveryLocationOption {
  value: string;
  label: string;
  /** "assigned" = from occupant_room_assignments, "recent" = pulled from past supply orders */
  source: 'assigned' | 'recent';
  isPrimary?: boolean;
}

/**
 * Combines the user's assigned rooms with their recently used delivery locations
 * so the order form can offer one-tap delivery picks instead of free text.
 */
export function useDeliveryLocations(userId?: string) {
  const { data: assignments = [] } = useUserRoomAssignments(userId);

  const recentQuery = useQuery({
    queryKey: ['supplyRecentDeliveryLocations', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_requests')
        .select('delivery_location, created_at')
        .eq('requester_id', userId!)
        .not('delivery_location', 'is', null)
        .neq('delivery_location', '')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      const seen = new Set<string>();
      const out: string[] = [];
      for (const row of data || []) {
        const loc = (row as any).delivery_location?.trim();
        if (!loc) continue;
        const key = loc.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(loc);
        if (out.length >= 5) break;
      }
      return out;
    },
  });

  const assignedOptions: DeliveryLocationOption[] = (assignments || [])
    .filter(a => a.rooms?.room_number)
    .map(a => ({
      value: a.rooms!.room_number,
      label: a.rooms!.name
        ? `Room ${a.rooms!.room_number} — ${a.rooms!.name}`
        : `Room ${a.rooms!.room_number}`,
      source: 'assigned' as const,
      isPrimary: a.is_primary,
    }));

  const assignedKeys = new Set(assignedOptions.map(o => o.value.toLowerCase()));
  const recentOptions: DeliveryLocationOption[] = (recentQuery.data || [])
    .filter(loc => !assignedKeys.has(loc.toLowerCase()))
    .map(loc => ({ value: loc, label: loc, source: 'recent' as const }));

  const primary = assignedOptions.find(o => o.isPrimary) ?? assignedOptions[0];

  return {
    options: [...assignedOptions, ...recentOptions],
    assignedOptions,
    recentOptions,
    defaultLocation: primary?.value ?? recentOptions[0]?.value ?? '',
    isLoading: recentQuery.isLoading,
  };
}
