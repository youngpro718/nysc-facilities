import React, { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateForTable } from '@/hooks/cache/invalidationMap';
import debounce from 'lodash/debounce';
import { logRealtimeEvent, logInvalidation } from '@/utils/reloadDebugger';

const TABLES = [
  'inventory_items',
  'inventory_item_transactions',
  'inventory_categories',
] as const;

type TableName = (typeof TABLES)[number];

function subscribeTables(channel: any, tables: readonly TableName[], onEvent: (table: TableName, payload: any) => void) {
  tables.forEach((table) => {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload: any) => onEvent(table, payload)
    );
  });
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const retriesRef = useRef(0);
  const lastInvalidationRef = useRef<Record<string, number>>({});

  // Throttle invalidations to prevent excessive refreshes
  // Only invalidate if at least 5 seconds have passed since last invalidation for this table
  const throttledInvalidate = useCallback((table: string) => {
    const now = Date.now();
    const lastTime = lastInvalidationRef.current[table] || 0;
    
    if (now - lastTime < 5000) {
      // Skip - too soon since last invalidation
      return;
    }
    
    lastInvalidationRef.current[table] = now;
    logInvalidation(table, 'RealtimeProvider');
    invalidateForTable(queryClient, table);
  }, [queryClient]);

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
          // Log for debugging
          logRealtimeEvent('global_changes', payload.eventType, table);
          throttledInvalidate(table);
        });

        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            retriesRef.current = 0;
            if (import.meta.env.DEV) {
              console.log('[Realtime] Connected to global_changes channel');
            }
          }
        });

        channelRef.current = channel;
      } catch (e) {
        // schedule reconnect with exponential backoff
        const attempt = retriesRef.current++;
        const delay = Math.min(60000, 2000 * Math.pow(2, attempt)); // Max 60s between retries
        console.warn(`[Realtime] Connection failed, retrying in ${delay}ms`);
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
  }, [queryClient, throttledInvalidate]);

  return <>{children}</>;
}

export default RealtimeProvider;
