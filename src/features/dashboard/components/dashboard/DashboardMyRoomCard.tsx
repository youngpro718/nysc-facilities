/**
 * DashboardMyRoomCard — "My Room" on the home page: the user's self-assigned
 * room, open issues in that room, and the self-serve picker when no room is
 * set. Full room management stays in Profile; this is the discoverable
 * entry point (only 2/10 profiles had set a room while it lived in Profile).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DoorOpen, MapPin, AlertTriangle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useUserRoomAssignments } from "@features/spaces/hooks/useUserRoomAssignments";
import { RoomSelector } from "@features/keys/components/keys/lockbox/RoomSelector";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from "@/lib/logger";

interface RoomIssue {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export function DashboardMyRoomCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: rawAssignments = [], isLoading } = useUserRoomAssignments(user?.id);

  // Same de-dup as MyRoomSection: legacy occupant-keyed + profile-keyed rows
  // can reference the same room; show each room once.
  const assignments = rawAssignments.filter(
    (a, i, arr) => arr.findIndex((x) => x.room_id === a.room_id) === i,
  );
  const primary = assignments.find((a) => a.is_primary) ?? assignments[0];

  // Open issues in the assigned room. issues.room_id and
  // occupant_room_assignments.room_id reference the same room ids
  // (verified: 0 mismatches across 142 rooms) — direct eq, no mapping.
  const { data: roomIssues = [] } = useQuery({
    queryKey: ["dashboard-room-issues", primary?.room_id],
    enabled: !!primary?.room_id,
    queryFn: async (): Promise<RoomIssue[]> => {
      const { data, error } = await supabase
        .from("issues")
        .select("id, title, status, priority, created_at")
        .eq("room_id", primary!.room_id)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as RoomIssue[];
    },
  });

  const setRoom = useMutation({
    mutationFn: async (roomId: string | null) => {
      if (!user) throw new Error("Not authenticated");
      await supabase
        .from("occupant_room_assignments")
        .delete()
        .eq("profile_id", user.id)
        .eq("assignment_type", "work_location");
      if (roomId) {
        const { error } = await supabase.from("occupant_room_assignments").insert({
          profile_id: user.id,
          room_id: roomId,
          assignment_type: "work_location",
          is_primary: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, roomId) => {
      toast.success(roomId ? "Room updated" : "Room cleared");
      queryClient.invalidateQueries({ queryKey: ["userRoomAssignments", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["occupantAssignments", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-room-issues"] });
    },
    onError: (error: unknown) => {
      logger.error("Error setting room:", error);
      toast.error(getErrorMessage(error) || "Failed to update room");
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4" />
            My Room
          </span>
          {primary && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => navigate("/profile")}
            >
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : primary ? (
          <>
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">
                  Room {primary.rooms?.room_number || primary.rooms?.name || "—"}
                </p>
                {primary.rooms?.name && primary.rooms?.room_number && (
                  <p className="text-xs text-muted-foreground truncate">{primary.rooms.name}</p>
                )}
              </div>
            </div>
            {/* Issues render only when present — never "0 issues" filler */}
            {roomIssues.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  Open issues in your room
                </p>
                {roomIssues.slice(0, 3).map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => navigate("/my-issues")}
                    className="flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-sm hover:bg-accent transition-colors"
                  >
                    <AlertTriangle
                      className={`h-3.5 w-3.5 shrink-0 ${
                        issue.priority === "high" || issue.priority === "critical"
                          ? "text-destructive"
                          : "text-amber-500"
                      }`}
                    />
                    <span className="flex-1 truncate">{issue.title}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                      {issue.status.replace("_", " ")}
                    </Badge>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Pick your room — it fills in automatically when you report an issue or
              order supplies.
            </p>
            <RoomSelector
              value={undefined}
              onChange={(roomId) => setRoom.mutate(roomId)}
              disabled={setRoom.isPending}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
