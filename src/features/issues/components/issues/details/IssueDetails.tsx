

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { IssuePhotoGrid } from "../card/IssuePhotoGrid";
import { IssueComments } from "../card/IssueComments";
import { toast } from "sonner";
import { EditIssueForm } from "../forms/EditIssueForm";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssueDetailsHeader } from "./components/IssueDetailsHeader";
import { IssueTimelineContent } from "./components/IssueTimelineContent";
import { useIssueData } from "./hooks/useIssueData";
import { IssueDetailsContent } from "./components/IssueDetailsContent";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CreateTaskDialog } from "@features/tasks/components/CreateTaskDialog";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IssueDetailsProps {
  issueId: string | null;
  onClose: () => void;
}

const RESOLUTION_TYPES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'replaced', label: 'Replaced' },
  { value: 'maintenance_performed', label: 'Maintenance Performed' },
  { value: 'no_action_needed', label: 'No Action Needed' },
  { value: 'deferred', label: 'Deferred' },
];

export const IssueDetails = ({ issueId, onClose }: IssueDetailsProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDiscard, confirmDiscardDialog] = useConfirmDialog();
  const { issue, issueLoading, timeline, timelineLoading, linkedTasks, linkedTasksLoading } = useIssueData(issueId);
  const { isAdmin, isFacilitiesManager } = useRolePermissions();
  const canCreateTaskFromIssue = isAdmin || isFacilitiesManager;

  // Resolution dialog state
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionType, setResolutionType] = useState('fixed');
  const [resolutionNotes, setResolutionNotes] = useState('');
  
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
      toast.success("Issue marked as seen");
    },
    onError: () => {
      toast.error("Failed to mark issue as seen");
    }
  });

  const resolveIssueMutation = useMutation({
    mutationFn: async () => {
      if (!issueId) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('issues')
        .update({
          status: 'resolved',
          resolution_type: resolutionType,
          resolution_notes: resolutionNotes.trim() || null,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id || null,
        })
        .eq('id', issueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', issueId] });
      queryClient.invalidateQueries({ queryKey: ['court-issues'] });
      toast.success("Issue resolved successfully");
      setResolveDialogOpen(false);
      setResolutionType('fixed');
      setResolutionNotes('');
    },
    onError: () => {
      toast.error("Failed to resolve issue");
    }
  });

  const handleMarkAsSeen = () => {
    if (!issue?.seen) {
      markAsSeenMutation.mutate();
    }
  };

  if (issueLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Issue not found
      </div>
    );
  }

  const handleEditClose = async () => {
    const confirmed = await confirmDiscard({ title: 'Discard Changes', description: 'Are you sure you want to discard your changes?', confirmLabel: 'Discard', variant: 'destructive' });
    if (confirmed) {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }
  };

  const isResolved = issue.status === 'resolved';

  return (
    <><div className="flex flex-col h-full overflow-hidden">
      {/* Resolved banner */}
      {isResolved && (
        <div className="flex items-center gap-2 px-6 py-2 bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Resolved
            {(issue as any).resolution_type && ` — ${(issue as any).resolution_type.replace(/_/g, ' ')}`}
          </span>
          {(issue as any).resolved_at && (
            <span className="text-xs text-green-600/70 dark:text-green-400/70 ml-auto">
              {new Date((issue as any).resolved_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {isEditing ? (
        <>
          <IssueDetailsHeader
            title="Edit Issue"
            status={issue.status}
            onEdit={handleEditClose}
            isEditing={true}
          />
          <ScrollArea className="flex-1 px-1">
            <div className="pr-4">
              <EditIssueForm 
                issue={issue} 
                onClose={() => setIsEditing(false)} 
                onSave={() => {
                  setIsEditing(false);
                  toast.success("Issue updated successfully");
                }}
              />
            </div>
          </ScrollArea>
        </>
      ) : (
        <>
          <IssueDetailsHeader
            title={issue.title}
            status={issue.status}
            issueId={issue.id}
            onEdit={() => setIsEditing(true)}
            onDelete={onClose}
            isEditing={false}
          />
          {canCreateTaskFromIssue && (
            <div className="px-6 pt-4 flex justify-end gap-2">
              {!isResolved && (
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setResolveDialogOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Resolve
                </Button>
              )}
              <CreateTaskDialog
                trigger={(
                  <Button variant="outline" size="sm">
                    Create Task
                  </Button>
                )}
                taskDefaults={{
                  title: `Follow-up: ${issue.title}`,
                  description: issue.description || '',
                  task_type: 'maintenance',
                  priority: (() => {
                    const issuePriority = String(issue.priority);
                    return issuePriority === 'urgent' || issuePriority === 'high' || issuePriority === 'critical'
                      ? 'high'
                      : 'medium';
                  })(),
                  to_room_id: issue.room_id || undefined,
                  issue_id: issue.id,
                }}
              />
            </div>
          )}
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
                    linkedTasks={linkedTasks}
                    linkedTasksLoading={linkedTasksLoading}
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
                  <IssuePhotoGrid photos={issue.photos || []} />
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
    </div>
    {confirmDiscardDialog}

    {/* Resolve Issue Dialog */}
    <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Resolve Issue
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Resolution Type</Label>
            <Select value={resolutionType} onValueChange={setResolutionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_TYPES.map(rt => (
                  <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="How was this resolved?"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => resolveIssueMutation.mutate()}
            disabled={resolveIssueMutation.isPending}
          >
            {resolveIssueMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Mark Resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
