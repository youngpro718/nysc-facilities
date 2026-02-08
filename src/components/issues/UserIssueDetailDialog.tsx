import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { IssueComments } from "./card/IssueComments";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  MapPin,
  Calendar,
  MessageSquare,
  Image,
  ArrowUpCircle,
  Loader2,
  X
} from "lucide-react";

interface UserIssueDetailDialogProps {
  issueId: string | null;
  open: boolean;
  onClose: () => void;
  onFollowUp?: (issueId: string) => void;
  onEscalate?: (issueId: string) => void;
}

export function UserIssueDetailDialog({
  issueId,
  open,
  onClose,
  onFollowUp,
  onEscalate,
}: UserIssueDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("details");

  const { data: issue, isLoading } = useQuery({
    queryKey: ["user-issue-detail", issueId],
    queryFn: async () => {
      if (!issueId) return null;
      const { data, error } = await supabase
        .from("issues")
        .select(`
          *,
          buildings (name),
          unified_spaces:room_id (name, room_number)
        `)
        .eq("id", issueId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!issueId && open,
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: typeof AlertCircle; color: string; label: string; bgColor: string }> = {
      open: {
        icon: AlertCircle,
        color: "text-red-600 dark:text-red-400",
        label: "Open",
        bgColor: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
      },
      in_progress: {
        icon: Settings,
        color: "text-blue-600 dark:text-blue-400",
        label: "In Progress",
        bgColor: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
      },
      resolved: {
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-400",
        label: "Resolved",
        bgColor: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
      },
      closed: {
        icon: CheckCircle,
        color: "text-gray-600",
        label: "Closed",
        bgColor: "bg-gray-50 border-gray-200",
      },
    };
    return configs[status] || configs.open;
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { label: string; variant: "destructive" | "secondary" | "outline" }> = {
      urgent: { label: "Urgent", variant: "destructive" },
      high: { label: "High", variant: "destructive" },
      medium: { label: "Medium", variant: "secondary" },
      low: { label: "Low", variant: "outline" },
    };
    return configs[priority] || configs.medium;
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "open": return 25;
      case "in_progress": return 60;
      case "resolved": return 100;
      case "closed": return 100;
      default: return 0;
    }
  };

  if (!open) return null;

  const statusConfig = issue ? getStatusConfig(issue.status) : null;
  const priorityConfig = issue ? getPriorityConfig(issue.priority) : null;
  const StatusIcon = statusConfig?.icon || AlertCircle;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !issue ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Issue not found</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-xl">{issue.title}</DialogTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant={priorityConfig?.variant}>
                      {priorityConfig?.label} Priority
                    </Badge>
                    <Badge variant="outline" className={statusConfig?.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig?.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Resolution Progress</span>
                <span className="font-medium">{getProgressPercentage(issue.status)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    issue.status === "resolved" || issue.status === "closed"
                      ? "bg-green-500"
                      : issue.status === "in_progress"
                      ? "bg-blue-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${getProgressPercentage(issue.status)}%` }}
                />
              </div>
            </div>

            {/* Status Message */}
            <Card className={`border ${statusConfig?.bgColor}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-5 w-5 ${statusConfig?.color}`} />
                  <div>
                    <p className={`font-medium ${statusConfig?.color}`}>
                      {issue.status === "open" && "Awaiting Assignment"}
                      {issue.status === "in_progress" && "Work in Progress"}
                      {issue.status === "resolved" && "Issue Resolved"}
                      {issue.status === "closed" && "Issue Closed"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {issue.status === "open" &&
                        "Your issue has been received and is waiting to be assigned."}
                      {issue.status === "in_progress" &&
                        "Our team is actively working on resolving this issue."}
                      {issue.status === "resolved" &&
                        "This issue has been resolved. If the problem persists, you can follow up."}
                      {issue.status === "closed" &&
                        "This issue has been closed. Contact support if you need further assistance."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="photos" className="flex items-center gap-1">
                  <Image className="h-4 w-4" />
                  Photos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {issue.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {(issue.buildings?.name || issue.unified_spaces?.name) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {issue.buildings?.name}
                          {issue.unified_spaces?.name && ` - ${issue.unified_spaces.name}`}
                          {issue.unified_spaces?.room_number && ` (${issue.unified_spaces.room_number})`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Reported</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(issue.created_at), "MMM d, yyyy")}
                        <span className="block text-xs">
                          ({formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })})
                        </span>
                      </p>
                    </div>
                  </div>

                  {issue.assigned_to && (
                    <div className="flex items-start gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Assigned To</p>
                        <p className="text-sm text-muted-foreground">{issue.assigned_to}</p>
                      </div>
                    </div>
                  )}

                  {issue.updated_at && issue.updated_at !== issue.created_at && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(issue.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {issue.resolution_notes && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Resolution Notes</p>
                    <p className="text-sm text-green-600 dark:text-green-400">{issue.resolution_notes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comments" className="mt-4">
                <IssueComments issueId={issue.id} />
              </TabsContent>

              <TabsContent value="photos" className="mt-4">
                {issue.photos && issue.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {issue.photos.map((photo: string, index: number) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Issue photo ${index + 1}`}
                        className="rounded-lg border object-cover aspect-video"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No photos attached</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {issue.status === "resolved" && onFollowUp && (
                <Button variant="outline" onClick={() => onFollowUp(issue.id)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Follow Up
                </Button>
              )}
              {["open", "in_progress"].includes(issue.status) &&
                issue.priority !== "urgent" &&
                onEscalate && (
                  <Button variant="outline" onClick={() => onEscalate(issue.id)}>
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Escalate
                  </Button>
                )}
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
