
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Issue, RecurringPattern, MaintenanceRequirements, ElectricalIssues, LightingFixture, ImpactLevel, FixtureType, FixtureStatus, FixturePosition } from "../types/IssueTypes";
import { IssueStatusBadge } from "../card/IssueStatusBadge";
import { IssuePhotos } from "../card/IssuePhotos";
import { IssueBadges } from "../card/IssueBadges";
import { IssueMetadata } from "../card/IssueMetadata";
import { IssueComments } from "../card/IssueComments";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EditIssueForm } from "../forms/EditIssueForm";
import { useState } from "react";
import { IssueDetailsHeader } from "./components/IssueDetailsHeader";
import { IssueTimelineContent } from "./components/IssueTimelineContent";
import { TimelineEvent } from "./types/TimelineTypes";

interface IssueDetailsProps {
  issueId: string | null;
  onClose: () => void;
}

export const IssueDetails = ({ issueId, onClose }: IssueDetailsProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: issue, isLoading: issueLoading } = useQuery({
    queryKey: ['issues', issueId],
    queryFn: async () => {
      if (!issueId) return null;
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          buildings(name),
          floors(name),
          rooms(name),
          lighting_fixtures(
            name,
            type,
            status,
            position,
            electrical_issues
          )
        `)
        .eq('id', issueId)
        .single();

      if (error) throw error;

      interface RawLightingFixture {
        name: string;
        type: FixtureType;
        status: FixtureStatus;
        position: FixturePosition;
        electrical_issues: Record<string, any>;
      }

      const transformLightingFixtures = (fixtures: RawLightingFixture[] | null): LightingFixture[] => {
        if (!fixtures || !Array.isArray(fixtures)) return [];
        return fixtures.map(fixture => ({
          name: fixture.name,
          type: fixture.type as FixtureType,
          status: fixture.status as FixtureStatus,
          position: fixture.position as FixturePosition,
          electrical_issues: fixture.electrical_issues ? {
            short_circuit: fixture.electrical_issues.short_circuit || false,
            wiring_issues: fixture.electrical_issues.wiring_issues || false,
            voltage_problems: fixture.electrical_issues.voltage_problems || false,
            ballast_issue: fixture.electrical_issues.ballast_issue || false
          } : undefined
        }));
      };

      // Transform the data to match our Issue type
      const transformedData: Issue = {
        ...data,
        lighting_fixtures: transformLightingFixtures(Array.isArray(data.lighting_fixtures) ? data.lighting_fixtures : null),
        recurring_pattern: data.recurring_pattern && typeof data.recurring_pattern === 'object' ? {
          is_recurring: Boolean((data.recurring_pattern as any).is_recurring),
          frequency: String((data.recurring_pattern as any).frequency || ''),
          last_occurrence: String((data.recurring_pattern as any).last_occurrence || ''),
          pattern_confidence: Number((data.recurring_pattern as any).pattern_confidence || 0)
        } : undefined,
        maintenance_requirements: data.maintenance_requirements && typeof data.maintenance_requirements === 'object' ? {
          scheduled: Boolean((data.maintenance_requirements as any).scheduled),
          frequency: String((data.maintenance_requirements as any).frequency || ''),
          last_maintenance: String((data.maintenance_requirements as any).last_maintenance || ''),
          next_due: String((data.maintenance_requirements as any).next_due || '')
        } : undefined,
        impact_level: (data.impact_level as ImpactLevel) || 'minimal',
      };

      return transformedData;
    },
    enabled: !!issueId
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['issue-timeline', issueId],
    queryFn: async () => {
      if (!issueId) return [];
      const { data, error } = await supabase
        .from('issue_history')
        .select('*')
        .eq('issue_id', issueId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data as TimelineEvent[];
    },
    enabled: !!issueId
  });

  const markAsSeenMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('issues')
        .update({ seen: true })
        .eq('id', issueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', issueId] });
      toast.success("Issue marked as seen");
    },
    onError: () => {
      toast.error("Failed to mark issue as seen");
    }
  });

  const handleMarkAsSeen = () => {
    if (!issue?.seen) {
      markAsSeenMutation.mutate();
    }
  };

  if (!issue || issueLoading) return null;

  if (isEditing) {
    return (
      <Dialog open={!!issueId} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col overflow-hidden">
          <IssueDetailsHeader
            title="Edit Issue"
            status={issue.status}
            onEdit={() => setIsEditing(false)}
          />
          <ScrollArea className="flex-1 px-1">
            <div className="pr-4">
              <EditIssueForm issue={issue} onClose={() => setIsEditing(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  const isOverdue = issue.due_date ? new Date(issue.due_date) < new Date() : false;
  const timeRemaining = issue.due_date 
    ? `Due in ${Math.ceil((new Date(issue.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
    : 'No due date set';

  return (
    <Dialog open={!!issueId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <IssueDetailsHeader
          title={issue.title}
          status={issue.status}
          onEdit={() => setIsEditing(true)}
        />

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="space-y-4">
                  <IssueBadges
                    status={issue.status}
                    priority={issue.priority}
                    isOverdue={isOverdue}
                    seen={issue.seen}
                    onMarkAsSeen={handleMarkAsSeen}
                  />
                  
                  <IssueMetadata
                    timeRemaining={timeRemaining}
                    dueDate={issue.due_date}
                    isOverdue={isOverdue}
                    buildingName={issue.buildings?.name}
                    floorName={issue.floors?.name}
                    roomName={issue.rooms?.name}
                    assigned_to={issue.assignee_id || 'Unassigned'}
                  />

                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p>{issue.description}</p>
                  </div>

                  {issue.resolution_notes && (
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-semibold">Resolution Notes</h3>
                      <p>{issue.resolution_notes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="timeline">
                <IssueTimelineContent
                  timeline={timeline}
                  timelineLoading={timelineLoading}
                  issueCreatedAt={issue.created_at}
                />
              </TabsContent>

              <TabsContent value="photos">
                <IssuePhotos photos={issue.photos} />
              </TabsContent>

              <TabsContent value="comments">
                <IssueComments issueId={issue.id} />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
