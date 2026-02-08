import { useEffect, useMemo } from "react";
import { logger } from '@/lib/logger';
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
      return data as unknown;
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
      return data as unknown;
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "court_sessions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["court-sessions"] });
          queryClient.invalidateQueries({ queryKey: ["conflict-detection"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coverage_assignments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["coverage-assignments"] });
          queryClient.invalidateQueries({ queryKey: ["court-sessions"] });
          queryClient.invalidateQueries({ queryKey: ["conflict-detection"] });
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
    actorId: string,
    isCovering: boolean = false
  ) => {
    try {
      // Optimistic broadcast
      await broadcast.send({ type: "broadcast", event: "judge_move_pending", payload: { fromRoomId, toRoomId, judgeName, isCovering } });
      const { error } = await supabase.rpc("move_judge", {
        p_from_room_id: fromRoomId,
        p_to_room_id: toRoomId,
        p_judge_name: judgeName,
        p_actor: actorId,
        p_is_covering: isCovering,
      });
      if (error) throw error;
      
      // Invalidate ALL court-related queries for real-time sync
      queryClient.invalidateQueries({ queryKey: K.attendance });
      queryClient.invalidateQueries({ queryKey: K.activity });
      queryClient.invalidateQueries({ queryKey: K.rooms });
      queryClient.invalidateQueries({ queryKey: ["court", "assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["interactive-operations"] });
      queryClient.invalidateQueries({ queryKey: ["quick-actions"] });
    } catch (e) {
      logger.error("onMoveJudge error", e);
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
    
    // Invalidate queries for real-time sync
    queryClient.invalidateQueries({ queryKey: K.attendance });
    queryClient.invalidateQueries({ queryKey: K.rooms });
    queryClient.invalidateQueries({ queryKey: ["court", "assignments"] });
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
    
    // Invalidate queries for real-time sync
    queryClient.invalidateQueries({ queryKey: K.attendance });
    queryClient.invalidateQueries({ queryKey: K.rooms });
    queryClient.invalidateQueries({ queryKey: ["court", "assignments"] });
  };

  const onMarkClerkPresence = async (
    courtRoomId: string,  // court_rooms.id
    clerkName: string,
    present: boolean,
    actorId: string
  ) => {
    const { error } = await supabase.rpc("mark_clerk_presence", {
      p_room_id: courtRoomId,
      p_clerk_name: clerkName,
      p_present: present,
      p_actor: actorId,
    });
    if (error) throw error;
    
    // Invalidate queries for real-time sync
    queryClient.invalidateQueries({ queryKey: K.attendance });
    queryClient.invalidateQueries({ queryKey: K.rooms });
    queryClient.invalidateQueries({ queryKey: ["court", "assignments"] });
  };

  return { onMoveJudge, onMarkPresent, onMarkAbsent, onMarkClerkPresence };
}

export function useCourtRooms() {
  return useQuery({
    queryKey: K.rooms,
    queryFn: async () => {
      // Fetch court rooms with assignments and attendance in one query
      const { data: rooms, error: roomsError } = await supabase
        .from("court_rooms")
        .select("id, room_id, room_number, courtroom_number, is_active, maintenance_status, operational_status")
        .order("room_number");
      
      if (roomsError) throw roomsError;
      if (!rooms) return [];

      // Fetch court assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select("room_id, justice, clerks, part, sergeant");
      
      if (assignmentsError) throw assignmentsError;

      // Fetch attendance data
      const { data: attendance, error: attendanceError } = await supabase
        .from("court_attendance")
        .select("room_id, judge_present, clerks_present_count, clerks_present_names");
      
      if (attendanceError) throw attendanceError;

      // Join all the data
      return rooms.map(room => {
        // Handle duplicate assignments - prefer one with a judge, or take first
        const roomAssignments = assignments?.filter(a => a.room_id === room.room_id) || [];
        const assignment = roomAssignments.find(a => a.justice && a.justice.trim()) || roomAssignments[0];
        const attendanceData = attendance?.find(a => a.room_id === room.id); // Use room.id not room.room_id!
        
        return {
          ...room,
          assigned_judge: assignment?.justice || null,
          assigned_clerks: assignment?.clerks || [],
          assigned_part: assignment?.part || null,
          assigned_sergeant: assignment?.sergeant || null,
          judge_present: attendanceData?.judge_present || false,
          clerks_present_count: attendanceData?.clerks_present_count || 0,
          clerks_present_names: attendanceData?.clerks_present_names || []
        };
      });
    },
  });
}
