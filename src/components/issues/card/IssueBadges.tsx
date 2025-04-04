
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IssueStatusBadge } from "./IssueStatusBadge";
import { cn } from "@/lib/utils";

export interface IssueBadgesProps {
  status: "open" | "in_progress" | "resolved";
  priority: string;
  isOverdue: boolean;
  seen: boolean;
  onMarkAsSeen: () => void;
}

export const IssueBadges = ({ 
  status, 
  priority, 
  isOverdue, 
  seen, 
  onMarkAsSeen 
}: IssueBadgesProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-600 ring-1 ring-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-600 ring-1 ring-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-600 ring-1 ring-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-600 ring-1 ring-gray-500/30';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <IssueStatusBadge status={status} />
      
      <Badge 
        variant="secondary" 
        className={cn("animate-in fade-in-50", getPriorityColor(priority))}
      >
        {priority}
      </Badge>
      
      {isOverdue && (
        <Badge 
          variant="destructive" 
          className="animate-in fade-in-50 bg-red-500/20 text-red-600 ring-1 ring-red-500/30"
        >
          Overdue
        </Badge>
      )}
      
      {!seen && (
        <Badge 
          variant="secondary" 
          className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors animate-in fade-in-50
            bg-blue-500/20 text-blue-600 ring-1 ring-blue-500/30" 
          onClick={onMarkAsSeen}
        >
          <Eye className="h-3 w-3 mr-1" />
          New
        </Badge>
      )}
    </div>
  );
};
