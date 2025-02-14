
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssuePhotos } from "../card/IssuePhotos";
import { IssueComments } from "../card/IssueComments";
import { EditIssueForm } from "../forms/EditIssueForm";
import { useState } from "react";
import { IssueDetailsHeader } from "./components/IssueDetailsHeader";
import { IssueTimelineContent } from "./components/IssueTimelineContent";
import { IssueDetailsContent } from "./components/IssueDetailsContent";
import { useIssueDetails } from "./hooks/useIssueDetails";

interface IssueDetailsProps {
  issueId: string | null;
  onClose: () => void;
}

export const IssueDetails = ({ issueId, onClose }: IssueDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { issue, issueLoading, markAsSeenMutation } = useIssueDetails(issueId);
  
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
                <IssueDetailsContent
                  issue={issue}
                  isOverdue={isOverdue}
                  timeRemaining={timeRemaining}
                  onMarkAsSeen={handleMarkAsSeen}
                />
              </TabsContent>

              <TabsContent value="timeline">
                <IssueTimelineContent
                  timeline={issue.timeline}
                  timelineLoading={false}
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
