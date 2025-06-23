
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  created_at: string;
  read: boolean;
  action_url?: string;
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get issues assigned to the user
      const { data: issues } = await supabase
        .from("issues")
        .select("id, title, status, created_at, priority")
        .eq("assigned_to", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

      // Get user's room assignments for notifications
      const { data: roomAssignments } = await supabase
        .from("occupant_room_assignments")
        .select(`
          id,
          rooms (
            id,
            name,
            room_number,
            floors (
              name
            )
          )
        `)
        .eq("occupant_id", user.id)
        .limit(3);

      const notifications: Notification[] = [];

      // Convert issues to notifications
      if (issues) {
        issues.forEach((issue) => {
          notifications.push({
            id: `issue-${issue.id}`,
            title: "New Issue Assigned",
            message: `Issue "${issue.title}" has been assigned to you`,
            type: issue.priority === "high" ? "warning" : "info",
            created_at: issue.created_at,
            read: false,
            action_url: `/issues?id=${issue.id}`,
          });
        });
      }

      // Convert room assignments to notifications
      if (roomAssignments) {
        roomAssignments.forEach((assignment) => {
          if (assignment.rooms) {
            notifications.push({
              id: `room-${assignment.id}`,
              title: "Room Assignment",
              message: `You are assigned to ${assignment.rooms.name} (${assignment.rooms.room_number}) on ${assignment.rooms.floors?.name}`,
              type: "info",
              created_at: new Date().toISOString(),
              read: false,
              action_url: `/spaces?room=${assignment.rooms.id}`,
            });
          }
        });
      }

      return notifications.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user?.id,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}
