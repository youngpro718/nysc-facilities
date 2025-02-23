import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const useDashboardSubscriptions = (onDataUpdate: () => void) => {
  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const channels: RealtimeChannel[] = [
        supabase
          .channel('room-assignments-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'occupant_room_assignments',
              filter: `occupant_id=eq.${user.id}`
            },
            (payload: any) => {
              console.log('Room assignment update received:', payload);
              onDataUpdate();
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
              filter: `created_by=eq.${user.id}`
            },
            (payload) => {
              console.log('Issues update received:', payload);
              onDataUpdate();
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
              filter: `occupant_id=eq.${user.id}`
            },
            (payload) => {
              console.log('Keys update received:', payload);
              onDataUpdate();
            }
          )
          .subscribe(),

        supabase
          .channel('hallways-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'hallways' },
            (payload) => {
              console.log('Hallways update received:', payload);
              onDataUpdate();
            }
          )
          .subscribe(),

        supabase
          .channel('doors-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'doors' },
            (payload) => {
              console.log('Doors update received:', payload);
              onDataUpdate();
            }
          )
          .subscribe(),
      ];

      return channels;
    };

    let channels: RealtimeChannel[] = [];
    setupRealtimeSubscriptions().then(setupChannels => {
      channels = setupChannels;
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [onDataUpdate]);
};

