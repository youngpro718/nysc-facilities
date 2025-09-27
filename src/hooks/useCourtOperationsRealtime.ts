import { useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
const K = {
  attendance: ["court", "attendance"] as const,
  status: ["court", "status"] as const,
  activity: ["court", "activity"] as const,
  staffOut: ["court", "staffOutToday"] as const,
  rooms: ["court", "rooms"] as const,
};

export function useCourtPresence(roomId?: string) {
  const { data } = useQuery({
    queryKey: roomId ? [...K.attendance, roomId] : K.attendance,
    queryFn: async () => {
      const q = supabase.from("court_attendance").select("*");
      const { data, error } = roomId ? await q.eq("room_id", roomId).maybeSingle() : await q.returns<any[]>();
      if (error) throw error;
      return data as any;
    },
  });
  return data;
}

export function useRoomStatus(roomId?: string) {
  const { data } = useQuery({
    queryKey: roomId ? [...K.status, roomId] : K.status,
    queryFn: async () => {
      const q = supabase.from("court_room_status").select("*");
      const { data, error } = roomId ? await q.eq("room_id", roomId).maybeSingle() : await q.returns<any[]>();
      if (error) throw error;
      return data as any;
    },
  });
  return data;
}

export function useStaffOutToday() {
  const { data } = useQuery({
    queryKey: K.staffOut,
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_out_today").select("*");
      if (error) throw error;
      return data as { staff_id: string; role: "judge" | "clerk"; kind: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });
  return data || [];
}

export function useCourtOperationsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("court_ops_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "court_activity_log" },
        () => {
          queryClient.invalidateQueries({ queryKey: K.activity });
          // Surface to notification hooks via query invalidation; NotificationBox listens to admin_notifications
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "court_attendance" },
        () => {
          queryClient.invalidateQueries({ queryKey: K.attendance });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "court_attendance" },
        () => {
          queryClient.invalidateQueries({ queryKey: K.attendance });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "court_room_status" },
        () => {
          queryClient.invalidateQueries({ queryKey: K.status });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "court_room_status" },
        () => {
          queryClient.invalidateQueries({ queryKey: K.status });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Broadcast channel for optimistic UI signals
  const broadcast = useMemo(() => supabase.channel("court_ops_broadcast"), []);

  const onMoveJudge = async (
    fromRoomId: string | null,
    toRoomId: string,
    judgeName: string,
    actorId: string
  ) => {
    try {
      // Optimistic broadcast
      await broadcast.send({ type: "broadcast", event: "judge_move_pending", payload: { fromRoomId, toRoomId, judgeName } });
      const { error } = await supabase.rpc("move_judge", {
        p_from_room: fromRoomId,
        p_to_room: toRoomId,
        p_judge_name: judgeName,
        p_actor: actorId,
      });
      if (error) throw error;
      // Queries will refresh via realtime; still nudge the cache
      queryClient.invalidateQueries({ queryKey: K.attendance });
      queryClient.invalidateQueries({ queryKey: K.activity });
    } catch (e) {
      console.error("onMoveJudge error", e);
      throw e;
    }
  };

  const onMarkPresent = async (
    roomId: string,
    role: "judge" | "clerk",
    actorId: string
  ) => {
    const { error } = await supabase.rpc("mark_presence", {
      p_room: roomId,
      p_role: role,
      p_present: true,
      p_actor: actorId,
    });
    if (error) throw error;
  };

  const onMarkAbsent = async (
    roomId: string,
    role: "judge" | "clerk",
    actorId: string
  ) => {
    const { error } = await supabase.rpc("mark_presence", {
      p_room: roomId,
      p_role: role,
      p_present: false,
      p_actor: actorId,
    });
    if (error) throw error;
  };

  return { onMoveJudge, onMarkPresent, onMarkAbsent };
}

export function useCourtRooms() {
  return useQuery({
    queryKey: K.rooms,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_rooms")
        .select(`
          id, 
          room_id, 
          room_number, 
          courtroom_number, 
          is_active,
          court_assignments!inner(justice)
        `)
        .order("room_number");
      if (error) throw error;
      return data?.map(room => ({
        ...room,
        assigned_judge: room.court_assignments?.[0]?.justice || null
      })) || [];
    },
  });
}
