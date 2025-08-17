// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export interface CourtIssue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  room_id: string;
  space_id: string;
  impact_level: string;
  created_at: string;
  updated_at: string;
  room_number?: string;
  courtroom_number?: string;
  assignments?: {
    justice: string;
    clerks: string[];
    sergeant: string;
  };
}

export interface CourtImpactNotification {
  id: string;
  issue_id: string;
  room_id: string;
  notification_type: 'courtroom_affected' | 'assignment_impact' | 'schedule_disruption';
  message: string;
  acknowledged: boolean;
  created_at: string;
}

export const useCourtIssuesIntegration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recentIssueEvents, setRecentIssueEvents] = useState<{ id: string; room_id: string; priority: string; ts: number }[]>([]);

  // Fetch active issues affecting courtrooms
  const { data: courtIssues, isLoading: issuesLoading } = useQuery({
    queryKey: ["court-issues"],
    queryFn: async (): Promise<CourtIssue[]> => {
      // First get the basic issues data
      const { data, error } = await supabase
        .from("issues")
        .select(`
          *,
          rooms(room_number)
        `)
        .in("status", ["open", "in_progress"])
        .not("room_id", "is", null)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Then get court room and assignment data separately to avoid complex joins
      const issuesWithCourtData = await Promise.all(
        (data || []).map(async (issue) => {
          // Get court room data
          const { data: courtRoom } = await supabase
            .from("court_rooms")
            .select("courtroom_number")
            .eq("room_id", issue.room_id)
            .maybeSingle();

          // Get court assignment data
          const { data: courtAssignment } = await supabase
            .from("court_assignments")
            .select("justice, clerks, sergeant")
            .eq("room_id", issue.room_id)
            .maybeSingle();

          return {
            ...issue,
            courtroom_number: courtRoom?.courtroom_number,
            assignments: courtAssignment ? {
              justice: courtAssignment.justice,
              clerks: courtAssignment.clerks || [],
              sergeant: courtAssignment.sergeant
            } : undefined
          };
        })
      );

      if (error) throw error;

      return issuesWithCourtData.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        room_id: issue.room_id,
        space_id: issue.space_id,
        impact_level: issue.impact_level,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        room_number: issue.rooms?.room_number,
        courtroom_number: issue.courtroom_number,
        assignments: issue.assignments,
        justice: issue.assignments?.justice || '',
        clerks: issue.assignments?.clerks || [],
        sergeant: issue.assignments?.sergeant || ''
      }));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Create courtroom shutdown when critical issue occurs
  const createCourtShutdown = useMutation({
    mutationFn: async ({ issueId, roomId, reason, notes }: {
      issueId: string;
      roomId: string;
      reason: string;
      notes: string;
    }) => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

      const { data, error } = await supabase
        .from("room_shutdowns")
        .insert({
          room_id: roomId,
          reason: reason as any,
          start_date: startDate,
          end_date: endDate,
          status: "scheduled",
          project_notes: `Automatic shutdown due to issue: ${notes}`,
          notifications_sent: {
            major: false,
            court_officer: false,
            clerks: false,
            judge: false,
          },
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-shutdowns"] });
      queryClient.invalidateQueries({ queryKey: ["courtroom-availability"] });
      toast({
        title: "Courtroom Shutdown Created",
        description: "Automatic shutdown created due to critical issue.",
      });
    },
  });

  // Send notifications to affected personnel
  const notifyAffectedPersonnel = useMutation({
    mutationFn: async ({ issue, personnel }: {
      issue: CourtIssue;
      personnel: string[];
    }) => {
      // This would integrate with your notification system
      // For now, we'll create a toast notification
      const message = `Courtroom ${issue.courtroom_number || issue.room_number} has a ${issue.priority} priority issue: ${issue.title}`;
      
      toast({
        title: "Courtroom Issue Alert",
        description: message,
        variant: issue.priority === "urgent" ? "destructive" : "default",
      });

      // You could extend this to send emails, SMS, or other notifications
      return { notified: personnel, message };
    },
  });

  // Real-time subscription for new issues
  useEffect(() => {
    // Helper to enrich a bare issue record with courtroom and assignment details
    const enrichIssue = async (issue: any) => {
      try {
        const [{ data: courtRoom }, { data: courtAssignment }] = await Promise.all([
          supabase.from("court_rooms").select("courtroom_number").eq("room_id", issue.room_id).maybeSingle(),
          supabase.from("court_assignments").select("justice, clerks, sergeant").eq("room_id", issue.room_id).maybeSingle(),
        ]);

        return {
          ...issue,
          courtroom_number: courtRoom?.courtroom_number,
          assignments: courtAssignment
            ? {
                justice: courtAssignment.justice,
                clerks: courtAssignment.clerks || [],
                sergeant: courtAssignment.sergeant,
              }
            : undefined,
          justice: courtAssignment?.justice || '',
          clerks: courtAssignment?.clerks || [],
          sergeant: courtAssignment?.sergeant || '',
        };
      } catch (e) {
        return issue;
      }
    };

    const channel = supabase
      .channel('court-issues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: 'room_id=not.is.null',
        },
        (payload) => {
          console.log('Court issue change detected:', payload);
          
          // Optimistically update cache for immediate UI updates
          queryClient.setQueryData(["court-issues"], (old: any[] | undefined) => {
            const current = Array.isArray(old) ? old : [];
            const evt = payload.eventType;
            const newRow: any = (payload as any).new;
            const oldRow: any = (payload as any).old;

            if (evt === 'INSERT' && newRow?.room_id) {
              // Prepend lightweight issue immediately
              const optimistic = {
                id: newRow.id,
                title: newRow.title,
                description: newRow.description,
                status: newRow.status,
                priority: newRow.priority,
                room_id: newRow.room_id,
                space_id: newRow.space_id,
                impact_level: newRow.impact_level,
                created_at: newRow.created_at,
                updated_at: newRow.updated_at,
                room_number: undefined,
                courtroom_number: undefined,
                assignments: undefined,
                justice: '',
                clerks: [],
                sergeant: '',
              };
              // Avoid duplicates
              const filtered = current.filter((i) => i.id !== optimistic.id);
              return [optimistic, ...filtered];
            }

            if (evt === 'UPDATE' && newRow?.id) {
              return current.map((i) => (i.id === newRow.id ? { ...i, ...newRow } : i));
            }

            if (evt === 'DELETE' && oldRow?.id) {
              return current.filter((i) => i.id !== oldRow.id);
            }

            return current;
          });

          // Kick off background enrichment for INSERT to fill courtroom/assignment details
          if (payload.eventType === 'INSERT' && (payload as any).new?.room_id) {
            const newRow: any = (payload as any).new;

            // Record recent event for UI highlights/banners
            setRecentIssueEvents((prev) => {
              const next = [{ id: newRow.id, room_id: newRow.room_id, priority: newRow.priority, ts: Date.now() }, ...prev.filter(e => e.id !== newRow.id)];
              return next.slice(0, 25); // keep short history
            });
            // Auto-expire highlight after 15s
            setTimeout(() => {
              setRecentIssueEvents((prev) => prev.filter((e) => e.id !== newRow.id));
            }, 15000);

            enrichIssue(newRow).then((enriched) => {
              queryClient.setQueryData(["court-issues"], (old: any[] | undefined) => {
                const current = Array.isArray(old) ? old : [];
                return [enriched, ...current.filter((i) => i.id !== enriched.id)];
              });
            });
          }

          // Still invalidate related queries to stay consistent
          queryClient.invalidateQueries({ queryKey: ["court-issues"] });
          queryClient.invalidateQueries({ queryKey: ["courtroom-availability"] });
          // Ensure admin dashboards and operations metrics refresh immediately
          queryClient.invalidateQueries({ queryKey: ["adminIssues"] });
          queryClient.invalidateQueries({ queryKey: ["interactive-operations"] });

          // Handle new critical issues (urgent/critical/high)
          if (
            payload.eventType === 'INSERT' &&
            ['urgent', 'critical', 'high'].includes(String((payload as any).new?.priority || '').toLowerCase())
          ) {
            const newIssue = (payload as any).new as any;
            toast({
              title: "URGENT: New Courtroom Issue",
              description: `Critical issue reported in room ${newIssue.room_id}: ${newIssue.title}`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  // Get issues for a specific courtroom
  const getIssuesForRoom = (roomId: string) => {
    return courtIssues?.filter(issue => issue.room_id === roomId) || [];
  };

  // Check if courtroom has critical issues
  const hasUrgentIssues = (roomId: string) => {
    return (
      courtIssues?.some(
        (issue) =>
          issue.room_id === roomId &&
          // Treat "urgent" (and optionally "critical") priority as urgent indicators
          (issue.priority === 'urgent' || issue.priority === 'critical')
      ) || false
    );
  };

  // Get impact summary for court operations
  const getCourtImpactSummary = () => {
    if (!courtIssues) return null;

    const affectedRooms = new Set(courtIssues.map(issue => issue.room_id));
    const urgentIssues = courtIssues.filter((issue) =>
      ['urgent', 'critical', 'high'].includes(String(issue.priority || '').toLowerCase())
    );
    const affectedAssignments = courtIssues.filter(issue => issue.assignments);

    return {
      totalAffectedRooms: affectedRooms.size,
      urgentIssues: urgentIssues.length,
      affectedAssignments: affectedAssignments.length,
      issues: courtIssues,
    };
  };

  // Recent issues helpers for UI highlight/banners
  const isIssueRecentlyAdded = (issueId: string) => recentIssueEvents.some(e => e.id === issueId);
  const getRecentlyAffectedRooms = () => Array.from(new Set(recentIssueEvents.map(e => e.room_id)));

  return {
    courtIssues: courtIssues || [],
    isLoading: issuesLoading,
    createCourtShutdown,
    notifyAffectedPersonnel,
    getIssuesForRoom,
    hasUrgentIssues,
    getCourtImpactSummary,
    recentIssueEvents,
    isIssueRecentlyAdded,
    getRecentlyAffectedRooms,
  };
};
