
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IssuePhotos } from "../card/IssuePhotos";
import { IssueComments } from "../card/IssueComments";
import { toast } from "sonner";
import { EditIssueForm } from "../forms/EditIssueForm";
import { useState } from "react";
import { IssueDetailsHeader } from "./components/IssueDetailsHeader";
import { IssueTimelineContent } from "./components/IssueTimelineContent";
import { useIssueData } from "./hooks/useIssueData";
import { IssueDetailsContent } from "./components/IssueDetailsContent";

interface IssueDetailsProps {
  issueId: string | null;
  onClose: () => void;
}

export const IssueDetails = ({ issueId, onClose }: IssueDetailsProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const { issue, issueLoading, timeline, timelineLoading } = useIssueData(issueId);
  
  const markAsSeenMutation = useMutation({
    mutationFn: async () => {
      if (!issueId) return;
      const { error } = await supabase
        .from('issues')
        .update({ seen: true })
        .eq('id', issueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', issueId] });
      toast.success("Issue marked as seen", {
        description: "The issue has been marked as viewed"
      });
    },
    onError: () => {
      toast.error("Failed to mark issue as seen", {
        description: "Please try again later"
      });
    }
  });

  const handleMarkAsSeen = () => {
    if (!issue?.seen) {
      markAsSeenMutation.mutate();
    }
  };

  if (!issue || issueLoading) {
    return null;
  }

  const handleEditClose = () => {
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  return (
    <Dialog open={!!issueId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95">
        {isEditing ? (
          <>
            <IssueDetailsHeader
              title="Edit Issue"
              status={issue.status}
              onEdit={handleEditClose}
            />
            <ScrollArea className="flex-1 px-1">
              <div className="pr-4">
                <EditIssueForm 
                  issue={issue} 
                  onClose={handleEditClose} 
                />
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <IssueDetailsHeader
              title={issue.title}
              status={issue.status}
              onEdit={() => setIsEditing(true)}
            />
            <ScrollArea className="flex-1">
              <div className="space-y-6 p-6">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="photos">Photos</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                  </TabsList>

                  <TabsContent 
                    value="details" 
                    className="animate-in slide-in-from-right-1"
                  >
                    <IssueDetailsContent
                      issue={issue}
                      isOverdue={!!issue.due_date && new Date(issue.due_date) < new Date()}
                      timeRemaining={issue.due_date 
                        ? `Due in ${Math.ceil((new Date(issue.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
                        : 'No due date set'}
                      onMarkAsSeen={handleMarkAsSeen}
                    />
                  </TabsContent>

                  <TabsContent 
                    value="timeline"
                    className="animate-in slide-in-from-right-1"
                  >
                    <IssueTimelineContent
                      timeline={timeline}
                      timelineLoading={timelineLoading}
                      issueCreatedAt={issue.created_at}
                    />
                  </TabsContent>

                  <TabsContent 
                    value="photos"
                    className="animate-in slide-in-from-right-1"
                  >
                    <IssuePhotos photos={issue.photos || []} />
                  </TabsContent>

                  <TabsContent 
                    value="comments"
                    className="animate-in slide-in-from-right-1"
                  >
                    <IssueComments issueId={issue.id} />
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
