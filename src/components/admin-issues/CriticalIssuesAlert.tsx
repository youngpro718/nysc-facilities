import { AlertTriangle, Clock, MapPin, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EnhancedIssue } from "@/hooks/dashboard/useAdminIssuesData";
import { formatDistanceToNow } from "date-fns";

interface CriticalIssuesAlertProps {
  criticalIssues: EnhancedIssue[];
  onIssueSelect: (issueId: string) => void;
}

export function CriticalIssuesAlert({ criticalIssues, onIssueSelect }: CriticalIssuesAlertProps) {
  if (criticalIssues.length === 0) return null;

  return (
    <Alert className="border-destructive bg-destructive/10">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription>
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-destructive">
            {criticalIssues.length} Critical Issue{criticalIssues.length > 1 ? 's' : ''} Require Immediate Attention
          </span>
        </div>
        
        <div className="grid gap-3 md:grid-cols-2">
          {criticalIssues.slice(0, 4).map((issue) => (
            <Card key={issue.id} className="p-3 border-destructive/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="text-xs">
                      CRITICAL
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-sm truncate mb-1">
                    {issue.title}
                  </h4>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {issue.rooms && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{issue.rooms.room_number}</span>
                      </div>
                    )}
                    
                    {issue.reporter && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{issue.reporter.first_name} {issue.reporter.last_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onIssueSelect(issue.id)}
                  className="shrink-0"
                >
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        {criticalIssues.length > 4 && (
          <div className="mt-3 text-center">
            <Button variant="outline" size="sm">
              View All {criticalIssues.length} Critical Issues
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}