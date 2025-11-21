import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeSubscription {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  handler: (payload: any) => void;
}

interface RealtimeHub {
  subscribe: (subscription: RealtimeSubscription) => void;
  unsubscribe: (subscription: RealtimeSubscription) => void;
  isConnected: boolean;
}

let hubInstance: {
  channel: ReturnType<typeof supabase.channel> | null;
  subscriptions: Map<string, RealtimeSubscription>;
  isConnected: boolean;
  connectionAttempts: number;
  maxRetries: number;
} | null = null;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Unified Realtime Hub - Consolidates all realtime subscriptions into a single channel
 * Reduces connection overhead from 20+ channels to 1-2 channels
 */
export const useRealtimeHub = (userId?: string, isAdmin?: boolean): RealtimeHub => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionsRef = useRef<Map<string, RealtimeSubscription>>(new Map());

  useEffect(() => {
    if (!userId) return;

    console.log('[RealtimeHub] Initializing hub for user:', userId);

    // Initialize singleton hub
    if (!hubInstance) {
      hubInstance = {
        channel: null,
        subscriptions: new Map(),
        isConnected: false,
        connectionAttempts: 0,
        maxRetries: MAX_RETRIES,
      };
    }

    const setupChannel = () => {
      if (hubInstance!.channel) {
        console.log('[RealtimeHub] Cleaning up existing channel');
        supabase.removeChannel(hubInstance!.channel);
        hubInstance!.channel = null;
      }

      const channelName = isAdmin ? 'unified-admin-hub' : 'unified-user-hub';
      const channel = supabase.channel(channelName);

      console.log(`[RealtimeHub] Creating ${channelName}`);

      // Add all pending subscriptions to the channel
      hubInstance!.subscriptions.forEach((sub, key) => {
        console.log(`[RealtimeHub] Adding subscription: ${key}`);
        (channel as any).on(
          'postgres_changes',
          {
            event: sub.event,
            schema: 'public',
            table: sub.table,
            ...(sub.filter ? { filter: sub.filter } : {}),
          },
          (payload: any) => {
            console.log(`[RealtimeHub] Event received for ${sub.table}:`, payload.eventType);
            try {
              sub.handler(payload);
            } catch (error) {
              console.error(`[RealtimeHub] Handler error for ${sub.table}:`, error);
            }
          }
        );
      });

      // Subscribe with retry logic
      channel.subscribe((status) => {
        console.log(`[RealtimeHub] ${channelName} status:`, status);

        if (status === 'SUBSCRIBED') {
          hubInstance!.isConnected = true;
          hubInstance!.connectionAttempts = 0;
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
          hubInstance!.isConnected = false;
          setIsConnected(false);

          if (hubInstance!.connectionAttempts < hubInstance!.maxRetries) {
            hubInstance!.connectionAttempts++;
            const delay = RETRY_DELAY_MS * hubInstance!.connectionAttempts;
            console.log(
              `[RealtimeHub] Retrying connection in ${delay}ms (attempt ${hubInstance!.connectionAttempts}/${hubInstance!.maxRetries})`
            );
            setTimeout(setupChannel, delay);
          } else {
            console.error(`[RealtimeHub] Failed to connect after ${hubInstance!.maxRetries} attempts`);
          }
        }
      });

      hubInstance!.channel = channel;
    };

    setupChannel();

    return () => {
      console.log('[RealtimeHub] Cleaning up hub');
      if (hubInstance?.channel) {
        supabase.removeChannel(hubInstance.channel);
        hubInstance.channel = null;
      }
    };
  }, [userId, isAdmin]);

  const subscribe = (subscription: RealtimeSubscription) => {
    const key = `${subscription.table}-${subscription.event}-${subscription.filter || 'all'}`;
    console.log(`[RealtimeHub] Subscribing to ${key}`);

    subscriptionsRef.current.set(key, subscription);

    if (hubInstance) {
      hubInstance.subscriptions.set(key, subscription);

      // If channel is already active, add the subscription immediately
      if (hubInstance.channel && hubInstance.isConnected) {
        console.log(`[RealtimeHub] Adding subscription to active channel: ${key}`);
        // Note: Supabase doesn't support adding subscriptions to active channels
        // Need to recreate the channel. For now, we'll do it on next mount.
      }
    }
  };

  const unsubscribe = (subscription: RealtimeSubscription) => {
    const key = `${subscription.table}-${subscription.event}-${subscription.filter || 'all'}`;
    console.log(`[RealtimeHub] Unsubscribing from ${key}`);

    subscriptionsRef.current.delete(key);

    if (hubInstance) {
      hubInstance.subscriptions.delete(key);
    }
  };

  return {
    subscribe,
    unsubscribe,
    isConnected,
  };
};
