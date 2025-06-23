
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";
import { useUserIssues } from "@/hooks/dashboard/useUserIssues";

interface IssueSummaryCardProps {
  userId: string;
}

export function IssueSummaryCard({ userId }: IssueSummaryCardProps) {
  const { userIssues } = useUserIssues(userId);

  const openIssues = userIssues?.filter(issue => issue.status === 'open') || [];
  const inProgressIssues = userIssues?.filter(issue => issue.status === 'in_progress') || [];
  const resolvedIssues = userIssues?.filter(issue => issue.status === 'resolved') || [];

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg sm:text-2xl font-semibold">Reported Issues</h2>
        </div>
        <Badge variant="secondary" className="font-normal">
          {userIssues?.length || 0} total
        </Badge>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4" />
              {openIssues.length}
            </div>
            <div className="text-xs text-muted-foreground">Open</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium text-yellow-600">
              <Clock className="h-4 w-4" />
              {inProgressIssues.length}
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium text-green-600">
              <CheckCircle className="h-4 w-4" />
              {resolvedIssues.length}
            </div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </div>
        </div>

        {userIssues && userIssues.length > 0 ? (
          <div className="space-y-2">
            {userIssues.slice(0, 3).map((issue) => (
              <div
                key={issue.id}
                className="flex items-start justify-between p-3 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{issue.title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {issue.buildings?.name} • {issue.rooms?.name}
                  </div>
                </div>
                <Badge
                  variant={
                    issue.status === 'open' ? 'destructive' :
                    issue.status === 'in_progress' ? 'default' : 'secondary'
                  }
                  className="text-xs ml-2 shrink-0"
                >
                  {issue.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            {userIssues.length > 3 && (
              <div className="text-center py-2 text-sm text-muted-foreground">
                +{userIssues.length - 3} more issues
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p>No issues reported</p>
          </div>
        )}
      </div>
    </Card>
  );
}
