
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface DashboardSubscriptionsProps {
  userId?: string;
  onDataUpdate?: () => void;
}

export const useDashboardSubscriptions = ({ userId, onDataUpdate }: DashboardSubscriptionsProps) => {
  useEffect(() => {
    if (!userId) return;

    const channels: RealtimeChannel[] = [
      supabase
        .channel('room-assignments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'occupant_room_assignments',
            filter: `occupant_id=eq.${userId}`
          },
          (payload: any) => {
            console.log('Room assignment update received:', payload);
            onDataUpdate?.();
          }
        )
        .subscribe(),

      supabase
        .channel('issues-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'issues',
            filter: `created_by=eq.${userId}`
          },
          (payload) => {
            console.log('Issues update received:', payload);
            onDataUpdate?.();
          }
        )
        .subscribe(),

      supabase
        .channel('keys-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'key_assignments',
            filter: `occupant_id=eq.${userId}`
          },
          (payload) => {
            console.log('Keys update received:', payload);
            onDataUpdate?.();
          }
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [userId, onDataUpdate]);
};
