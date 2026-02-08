import { useState } from "react";
import { logger } from '@/lib/logger';
import { Check, Clock, AlertTriangle, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { EnhancedIssue } from "@/hooks/dashboard/useAdminIssuesData";

interface QuickUpdateActionsProps {
  issue: EnhancedIssue;
  onUpdate: () => void;
}

export function QuickUpdateActions({ issue, onUpdate }: QuickUpdateActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

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