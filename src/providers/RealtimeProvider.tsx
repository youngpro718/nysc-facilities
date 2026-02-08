import React, { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateForTable } from '@/hooks/cache/invalidationMap';

const TABLES = [
  'inventory_items',
  'inventory_item_transactions',
  'inventory_categories',
] as const;

type TableName = (typeof TABLES)[number];

function subscribeTables(channel: unknown, tables: readonly TableName[], onEvent: (table: TableName, payload: Record<string, unknown>) => void) {
  tables.forEach((table) => {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload: Record<string, unknown>) => onEvent(table, payload)
    );
  });
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const channelRef = useRef<unknown>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    let unsubscribed = false;

    const setup = () => {
      if (unsubscribed) return;
      try {
        // Clean previous channel if any
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        const channel = supabase.channel('global_changes');
        subscribeTables(channel, TABLES, (table, payload) => {
          logger.debug(`[Realtime] ${table} ->`, payload.eventType);
          invalidateForTable(queryClient, table);
        });

        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            retriesRef.current = 0;
          }
        });

        channelRef.current = channel;
      } catch (e) {
        // schedule reconnect
        const attempt = retriesRef.current++;
        const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
        setTimeout(setup, delay);
      }
    };

    setup();

    return () => {
      unsubscribed = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);

  return <>{children}</>;
}

export default RealtimeProvider;
