import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

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

  // Fetch active issues affecting courtrooms
  const { data: courtIssues, isLoading: issuesLoading } = useQuery({
    queryKey: ["court-issues"],
    queryFn: async (): Promise<CourtIssue[]> => {
      const { data, error } = await supabase
        .from("issues")
        .select(`
          *,
          rooms:room_id(room_number),
          court_rooms:room_id(courtroom_number),
          court_assignments:room_id(justice, clerks, sergeant)
        `)
        .in("status", ["open", "in_progress"])
        .not("room_id", "is", null)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        room_id: issue.room_id,
        space_id: issue.space_id,
        impact_level: issue.impact_level || 'medium',
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        room_number: (issue.rooms as any)?.room_number,
        courtroom_number: (issue.court_rooms as any)?.courtroom_number,
        assignments: (issue.court_assignments as any) ? {
          justice: (issue.court_assignments as any).justice,
          clerks: (issue.court_assignments as any).clerks || [],
          sergeant: (issue.court_assignments as any).sergeant,
        } : undefined,
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
          
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ["court-issues"] });
          queryClient.invalidateQueries({ queryKey: ["courtroom-availability"] });

          // Handle new critical issues
          if (payload.eventType === 'INSERT' && payload.new.priority === 'urgent') {
            const newIssue = payload.new as any;
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
    return courtIssues?.some(issue => 
      issue.room_id === roomId && 
      (issue.priority === 'urgent' || issue.status === 'urgent')
    ) || false;
  };

  // Get impact summary for court operations
  const getCourtImpactSummary = () => {
    if (!courtIssues) return null;

    const affectedRooms = new Set(courtIssues.map(issue => issue.room_id));
    const urgentIssues = courtIssues.filter(issue => issue.priority === 'urgent');
    const affectedAssignments = courtIssues.filter(issue => issue.assignments);

    return {
      totalAffectedRooms: affectedRooms.size,
      urgentIssues: urgentIssues.length,
      affectedAssignments: affectedAssignments.length,
      issues: courtIssues,
    };
  };

  return {
    courtIssues: courtIssues || [],
    isLoading: issuesLoading,
    createCourtShutdown,
    notifyAffectedPersonnel,
    getIssuesForRoom,
    hasUrgentIssues,
    getCourtImpactSummary,
  };
};
