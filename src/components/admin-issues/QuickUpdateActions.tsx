import { useState } from "react";
import { logger } from '@/lib/logger';
import { Check, Clock, AlertTriangle, MessageCircle, Ticket, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { EnhancedIssue } from "@/hooks/dashboard/useAdminIssuesData";

interface QuickUpdateActionsProps {
  issue: EnhancedIssue;
  onUpdate: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IssueWithExtras = EnhancedIssue & {
  external_ticket_number?: string | null;
  external_ticket_status?: string | null;
  external_system?: string | null;
  confirmed_resolved_by_user?: boolean;
};

export function QuickUpdateActions({ issue, onUpdate }: QuickUpdateActionsProps) {
  const issueData = issue as unknown as IssueWithExtras;
  const [isUpdating, setIsUpdating] = useState(false);
  const [comment, setComment] = useState("");
  const [ticketNumber, setTicketNumber] = useState(issueData.external_ticket_number || "");
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const { toast } = useToast();

  const handleSaveTicket = async () => {
    if (!ticketNumber.trim()) {
      toast({ title: "Error", description: "Please enter a ticket number", variant: "destructive" });
      return;
    }
    setIsSavingTicket(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('issues')
        .update({
          external_ticket_number: ticketNumber.trim(),
          external_system: 'Archibus',
          external_ticket_status: 'entered',
          external_ticket_entered_at: new Date().toISOString(),
          external_ticket_entered_by: userId,
          status: issue.status === 'open' ? 'in_progress' : issue.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', issue.id);

      if (error) throw error;

      toast({ title: "Ticket Saved", description: `Ticket #${ticketNumber.trim()} linked to this issue` });
      onUpdate();
    } catch (error) {
      logger.error('Error saving ticket:', error);
      toast({ title: "Error", description: "Failed to save ticket number", variant: "destructive" });
    } finally {
      setIsSavingTicket(false);
    }
  };

  const handleTicketStatusUpdate = async (newTicketStatus: string) => {
    setIsSavingTicket(true);
    try {
      const updatePayload: Record<string, unknown> = {
        external_ticket_status: newTicketStatus,
        updated_at: new Date().toISOString(),
      };
      if (newTicketStatus === 'completed') {
        updatePayload.status = 'resolved';
      }
      const { error } = await supabase
        .from('issues')
        .update(updatePayload)
        .eq('id', issue.id);

      if (error) throw error;

      toast({
        title: "Ticket Status Updated",
        description: newTicketStatus === 'completed'
          ? "Ticket completed — issue marked as resolved"
          : `Ticket status: ${newTicketStatus.replace('_', ' ')}`
      });
      onUpdate();
    } catch (error) {
      logger.error('Error updating ticket status:', error);
      toast({ title: "Error", description: "Failed to update ticket status", variant: "destructive" });
    } finally {
      setIsSavingTicket(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('issues')
        .update({ 
          status: newStatus as "open" | "in_progress" | "resolved",
          updated_at: new Date().toISOString()
        })
        .eq('id', issue.id);

      if (error) throw error;

      // Add a comment if provided
      if (comment.trim()) {
        await supabase
          .from('issue_comments')
          .insert({
            issue_id: issue.id,
            author_id: (await supabase.auth.getUser()).data.user?.id,
            content: comment.trim()
          });
      }

      toast({
        title: "Issue Updated",
        description: `Status changed to ${newStatus.replace('_', ' ')}`
      });
      
      setComment("");
      onUpdate();
    } catch (error) {
      logger.error('Error updating issue:', error);
      toast({
        title: "Error",
        description: "Failed to update issue",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityUpdate = async (newPriority: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('issues')
        .update({ 
          priority: newPriority as "low" | "medium" | "high",
          updated_at: new Date().toISOString()
        })
        .eq('id', issue.id);

      if (error) throw error;

      toast({
        title: "Priority Updated",
        description: `Priority changed to ${newPriority}`
      });
      
      onUpdate();
    } catch (error) {
      logger.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const quickStatusActions = [
    { 
      status: 'in_progress', 
      label: 'Start Progress', 
      icon: Clock, 
      variant: 'secondary' as const,
      show: issue.status === 'open'
    },
    { 
      status: 'resolved', 
      label: 'Mark Resolved', 
      icon: Check, 
      variant: 'default' as const,
      show: issue.status !== 'resolved'
    },
    { 
      status: 'open', 
      label: 'Reopen', 
      icon: AlertTriangle, 
      variant: 'outline' as const,
      show: issue.status === 'resolved'
    }
  ].filter(action => action.show);

  return (
    <div className="space-y-3 border-t pt-3">
      {/* Quick Status Actions */}
      <div className="flex flex-wrap gap-2">
        {quickStatusActions.map(action => {
          const Icon = action.icon;
          return (
            <Button
              key={action.status}
              variant={action.variant}
              size="sm"
              onClick={() => handleStatusUpdate(action.status)}
              disabled={isUpdating}
              className="text-xs"
            >
              <Icon className="h-3 w-3 mr-1" />
              {action.label}
            </Button>
          );
        })}
      </div>

      {/* Priority Update */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Priority:</span>
        <Select value={issue.priority} onValueChange={handlePriorityUpdate}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* External Ticket Tracking */}
      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center gap-2">
          <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">External Ticket (Archibus)</span>
          {issueData.external_ticket_number && (
            <Badge variant="secondary" className="text-[10px] ml-auto">
              {issueData.external_ticket_status === 'entered' && '📋 In System'}
              {issueData.external_ticket_status === 'in_progress' && '🔧 Work Started'}
              {issueData.external_ticket_status === 'completed' && '✅ Completed'}
              {!issueData.external_ticket_status && '📋 Entered'}
            </Badge>
          )}
        </div>

        {issueData.external_ticket_number ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-mono font-medium">{issueData.external_ticket_number}</span>
              {issueData.external_system && (
                <span className="text-xs text-muted-foreground ml-auto">{issueData.external_system}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Select
                value={issueData.external_ticket_status || 'entered'}
                onValueChange={handleTicketStatusUpdate}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Ticket status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entered">Entered in System</SelectItem>
                  <SelectItem value="in_progress">Work Started</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {issueData.confirmed_resolved_by_user && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded-md">
                <Check className="h-3.5 w-3.5" />
                User confirmed this issue is resolved
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Enter ticket # from Archibus..."
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Button
              size="sm"
              onClick={handleSaveTicket}
              disabled={isSavingTicket || !ticketNumber.trim()}
              className="text-xs h-8"
            >
              {isSavingTicket ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Ticket className="h-3 w-3 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Add Comment */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment or update..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[60px] text-xs"
        />
        {comment.trim() && (
          <Button
            size="sm"
            onClick={() => handleStatusUpdate(issue.status)}
            disabled={isUpdating}
            className="text-xs"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Add Comment
          </Button>
        )}
      </div>
    </div>
  );
}