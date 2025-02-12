
import { format } from "date-fns";
import { IssueHistory } from "./types/IssueTypes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, CheckCircle2, AlertCircle } from "lucide-react";

interface IssueHistoryProps {
  history: IssueHistory[];
}

export function IssueHistory({ history }: IssueHistoryProps) {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'status_change':
        return <History className="h-4 w-4" />;
      case 'resolution':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">History</h3>
      <div className="space-y-2">
        {history.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getActionIcon(item.action_type)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {item.action_type === 'status_change' ? 'Status updated' : 
                       item.action_type === 'resolution' ? 'Issue resolved' : 
                       'Action taken'}
                    </span>
                    {item.action_type === 'status_change' && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{item.previous_status}</Badge>
                        →
                        <Badge>{item.new_status}</Badge>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(item.performed_at), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
                {item.action_type === 'resolution' && item.action_details && (
                  <div className="text-sm">
                    <p>Resolution: {item.action_details.resolution_type}</p>
                    {item.action_details.resolution_notes && (
                      <p className="mt-1 text-muted-foreground">
                        {item.action_details.resolution_notes}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>By {item.performed_by}</span>
                </div>
                {item.notes && (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
