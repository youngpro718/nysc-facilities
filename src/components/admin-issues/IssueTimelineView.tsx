import { formatDistanceToNow } from "date-fns";
import { Clock, MapPin, User, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EnhancedIssue } from "@/hooks/dashboard/useAdminIssuesData";

interface IssueTimelineViewProps {
  issues: EnhancedIssue[];
  onIssueUpdate: () => void;
}

export function IssueTimelineView({ issues, onIssueUpdate }: IssueTimelineViewProps) {
  const groupedByDate = issues.reduce((acc, issue) => {
    const date = new Date(issue.created_at).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(issue);
    return acc;
  }, {} as Record<string, EnhancedIssue[]>);

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
            <Badge variant="outline" className="ml-2">
              {groupedByDate[date].length} issues
            </Badge>
          </h3>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
            
            <div className="space-y-4">
              {groupedByDate[date]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((issue, index) => (
                <div key={issue.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 w-8 h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  </div>
                  
                  {/* Issue card */}
                  <Card className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getPriorityColor(issue.priority) as any} className="text-xs">
                            {issue.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {issue.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <h4 className="font-semibold text-sm mb-1">
                          {issue.title}
                        </h4>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {issue.description}
                        </p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {issue.rooms && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{issue.rooms.room_number} - {issue.rooms.name}</span>
                        </div>
                      )}
                      
                      {issue.reporter && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{issue.reporter.first_name} {issue.reporter.last_name}</span>
                        </div>
                      )}
                      
                      {issue.comments_count > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{issue.comments_count} comments</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}