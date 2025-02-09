
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IssueBadgesProps {
  status: "open" | "in_progress" | "resolved";
  priority: string;
  isOverdue: boolean;
  seen: boolean;
  onMarkAsSeen: () => void;
}

export const IssueBadges = ({ 
  priority, 
  isOverdue, 
  seen, 
  onMarkAsSeen 
}: IssueBadgesProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Badge className={`${getPriorityColor(priority)} animate-in fade-in-50`}>
        {priority}
      </Badge>
      
      {isOverdue && (
        <Badge variant="destructive" className="animate-in fade-in-50">
          Overdue
        </Badge>
      )}
      
      {!seen && (
        <Badge 
          variant="secondary" 
          className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors animate-in fade-in-50" 
          onClick={onMarkAsSeen}
        >
          <Eye className="h-3 w-3 mr-1" />
          New
        </Badge>
      )}
    </div>
  );
};
