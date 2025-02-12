
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Issue, LightingFixture } from "../types/IssueTypes";
import { IssueStatusBadge } from "../card/IssueStatusBadge";
import { IssuePhotos } from "../card/IssuePhotos";
import { IssueBadges } from "../card/IssueBadges";
import { IssueMetadata } from "../card/IssueMetadata";
import { IssueComments } from "../card/IssueComments";
import { Loader2, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface IssueDetailsProps {
  issueId: string | null;
  onClose: () => void;
}

interface TimelineEvent {
  id: string;
  issue_id: string;
  action_type: string;
  performed_by: string;
  performed_at: string;
  previous_status?: string;
  new_status?: string;
  action_details?: Record<string, any>;
  notes?: string;
}

export const IssueDetails = ({ issueId, onClose }: IssueDetailsProps) => {
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

      const transformedData = {
        ...data,
        lighting_fixtures: data.lighting_fixtures ? [data.lighting_fixtures] : []
      } as Issue;

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

  if (!issue || issueLoading) return null;

  const isOverdue = issue.due_date ? new Date(issue.due_date) < new Date() : false;
  const timeRemaining = issue.due_date 
    ? `Due in ${Math.ceil((new Date(issue.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
    : 'No due date set';

  const getTimelineIcon = (actionType: string) => {
    switch (actionType) {
      case 'status_change':
        return <Clock className="h-4 w-4" />;
      case 'resolution':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTimelineContent = (event: TimelineEvent) => {
    switch (event.action_type) {
      case 'status_change':
        return (
          <>
            <p className="font-medium">Status Changed</p>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{event.previous_status}</Badge>
              →
              <Badge>{event.new_status}</Badge>
            </div>
          </>
        );
      case 'resolution':
        return (
          <>
            <p className="font-medium">Issue Resolved</p>
            {event.action_details && (
              <p className="text-sm text-muted-foreground">
                Resolution type: {event.action_details.resolution_type}
                {event.action_details.resolution_notes && (
                  <>
                    <br />
                    {event.action_details.resolution_notes}
                  </>
                )}
              </p>
            )}
          </>
        );
      default:
        return <p className="font-medium">{event.action_type}</p>;
    }
  };

  return (
    <Dialog open={!!issueId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>{issue.title}</span>
            <IssueStatusBadge status={issue.status} />
          </DialogTitle>
        </DialogHeader>

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
                    onMarkAsSeen={() => {}} // TODO: Implement mark as seen
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
                {timelineLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-l-2 border-muted pl-4 space-y-4">
                      {/* Creation event always shown first */}
                      <div className="relative">
                        <div className="absolute -left-[21px] rounded-full w-4 h-4 bg-background border-2 border-primary"></div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(issue.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                          <p className="font-medium">Issue Created</p>
                        </div>
                      </div>

                      {/* Timeline events */}
                      {timeline?.map((event) => (
                        <div key={event.id} className="relative">
                          <div className="absolute -left-[21px] rounded-full w-4 h-4 bg-background border-2 border-primary flex items-center justify-center">
                            {getTimelineIcon(event.action_type)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.performed_at), 'MMM d, yyyy HH:mm')}
                            </p>
                            {getTimelineContent(event)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
