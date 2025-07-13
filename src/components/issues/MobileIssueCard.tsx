import { Issue } from "./types/IssueTypes";
import { MobileCardView } from "@/components/mobile/MobileCardView";
import { MobileActionSheet } from "@/components/mobile/MobileActionSheet";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle, 
  XCircle,
  Edit,
  MessageSquare,
  Phone,
  Mail
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface MobileIssueCardProps {
  issue: Issue;
  onView: (issue: Issue) => void;
  onEdit: (issue: Issue) => void;
  onAssign: (issue: Issue) => void;
  onResolve: (issue: Issue) => void;
  onClose: (issue: Issue) => void;
  onComment: (issue: Issue) => void;
}

export function MobileIssueCard({
  issue,
  onView,
  onEdit,
  onAssign,
  onResolve,
  onClose,
  onComment
}: MobileIssueCardProps) {
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  const getPriorityColor = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'default';
      case 'closed': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return <AlertCircle className="h-3 w-3" />;
      case 'in_progress': return <Clock className="h-3 w-3" />;
      case 'resolved': return <CheckCircle className="h-3 w-3" />;
      case 'closed': return <XCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const actions = [
    {
      id: 'view',
      label: 'View Details',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => onView(issue)
    },
    {
      id: 'edit',
      label: 'Edit Issue',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => onEdit(issue)
    },
    {
      id: 'assign',
      label: 'Assign to Someone',
      icon: <User className="h-4 w-4" />,
      onClick: () => onAssign(issue)
    }
  ];

  // Add status-specific actions
  if (issue.status === 'open' || issue.status === 'in_progress') {
    actions.push({
      id: 'resolve',
      label: 'Mark as Resolved',
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: () => onResolve(issue)
    });
  }

  if (issue.status === 'resolved') {
    actions.push({
      id: 'close',
      label: 'Close Issue',
      icon: <XCircle className="h-4 w-4" />,
      onClick: () => onClose(issue)
    });
  }

  const quickActions = [
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Comment',
      onClick: () => onComment(issue),
      variant: 'outline' as const
    }
  ];

  // Add contact actions if assignee exists
  // Note: The Issue interface doesn't have assignee_email/phone properties yet
  // These would need to be added to the Issue type when implementing assignee functionality

  const badges = [
    {
      label: issue.priority,
      variant: getPriorityColor(issue.priority)
    }
  ];

  const status = {
    label: issue.status.replace('_', ' ').toUpperCase(),
    variant: getStatusColor(issue.status)
  };

  return (
    <MobileActionSheet
      trigger={
        <div className="w-full">
          <MobileCardView
            title={issue.title}
            subtitle={issue.type}
            description={issue.description}
            status={status}
            badges={badges}
            quickActions={quickActions}
            onCardClick={() => onView(issue)}
            onMenuClick={() => setActionSheetOpen(true)}
          >
            {/* Additional issue details */}
            <div className="space-y-2 text-sm text-muted-foreground">
              {issue.rooms?.name && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Room: {issue.rooms.name}</span>
                </div>
              )}
              
              {issue.assigned_to && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>Assigned to: {issue.assigned_to}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Created {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                </span>
              </div>
              
              {issue.due_date && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    Due {formatDistanceToNow(new Date(issue.due_date), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </MobileCardView>
        </div>
      }
      title="Issue Actions"
      description={`Actions for "${issue.title}"`}
      actions={actions}
      open={actionSheetOpen}
      onOpenChange={setActionSheetOpen}
    />
  );
}