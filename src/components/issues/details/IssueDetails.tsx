
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

interface IssueDetailsProps {
  issueId: string | null;
  onClose: () => void;
}

export const IssueDetails = ({ issueId, onClose }: IssueDetailsProps) => {
  const { data: issue, isLoading } = useQuery({
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

      // Transform the lighting_fixtures to ensure it's always an array
      const transformedData = {
        ...data,
        lighting_fixtures: data.lighting_fixtures ? [data.lighting_fixtures] : []
      } as Issue;

      return transformedData;
    },
    enabled: !!issueId
  });

  if (!issue || isLoading) return null;

  const isOverdue = issue.due_date ? new Date(issue.due_date) < new Date() : false;
  const timeRemaining = issue.due_date 
    ? `Due in ${Math.ceil((new Date(issue.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
    : 'No due date set';

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
                <div className="space-y-4">
                  <div className="border-l-2 border-muted pl-4 space-y-4">
                    <div className="relative">
                      <div className="absolute -left-[21px] rounded-full w-4 h-4 bg-background border-2 border-primary"></div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(issue.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                        <p className="font-medium">Issue Created</p>
                      </div>
                    </div>
                    {/* Add more timeline items here */}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="photos">
                <IssuePhotos photos={issue.photos} />
              </TabsContent>

              <TabsContent value="comments">
                <div className="space-y-4">
                  {/* TODO: Implement comments section */}
                  <p className="text-muted-foreground">No comments yet.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
