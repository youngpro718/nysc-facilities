import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseRealtimeOptions {
  table: string;
  queryKeys: string[];
  showToasts?: boolean;
}

export function useRealtime({ table, queryKeys, showToasts = false }: UseRealtimeOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Create channel for real-time updates
    channelRef.current = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`Real-time update for ${table}:`, payload);
          
          // Invalidate and refetch related queries
          queryKeys.forEach(key => {
            queryClient.invalidateQueries({ queryKey: [key] });
          });

          // Show toast notifications for important updates
          if (showToasts) {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            
            switch (eventType) {
              case 'INSERT':
                toast({
                  title: "New Record Added",
                  description: `A new ${table.replace('_', ' ')} has been created.`,
                  variant: "default",
                });
                break;
              case 'UPDATE':
                // Show specific updates for status changes
                if (table === 'room_shutdowns' && oldRecord?.status !== newRecord?.status) {
                  toast({
                    title: "Status Updated",
                    description: `Room shutdown status changed to ${newRecord.status}.`,
                    variant: "default",
                  });
                }
                break;
              case 'DELETE':
                toast({
                  title: "Record Deleted",
                  description: `A ${table.replace('_', ' ')} has been removed.`,
                  variant: "destructive",
                });
                break;
            }
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, queryKeys, queryClient, showToasts, toast]);

  return channelRef.current;
}