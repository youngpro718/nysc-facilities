
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Issue } from "@/components/issues/types/IssueTypes";
import { IssueStatusBadge } from "@/components/issues/card/IssueStatusBadge";
import { useDialogManager } from "@/hooks/useDialogManager";
import { ArrowUpRight, AlertCircle } from "lucide-react";

interface ReportedIssuesCardProps {
  issues: Issue[];
}

export function ReportedIssuesCard({ issues }: ReportedIssuesCardProps) {
  const { openDialog } = useDialogManager();

  const handleViewDetails = (issueId: string) => {
    openDialog('issueDetails', { issueId });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Reported Issues</h2>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>You haven't reported any issues yet.</p>
        </div>
      ) : (
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-4 bg-background">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{issue.title}</h3>
                  <IssueStatusBadge status={issue.status} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {issue.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {issue.created_at && (
                      <>Reported: {new Date(issue.created_at).toLocaleDateString()}</>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(issue.id);
                    }}
                  >
                    View Details
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
