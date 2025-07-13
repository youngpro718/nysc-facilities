import { Check, Clock, AlertTriangle, Users, X, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface BulkIssueManagerProps {
  selectedIssues: string[];
  onBulkAction: (action: string, issueIds: string[]) => void;
  onClearSelection: () => void;
}

export function BulkIssueManager({ 
  selectedIssues, 
  onBulkAction, 
  onClearSelection 
}: BulkIssueManagerProps) {
  const bulkActions = [
    { 
      id: 'mark_in_progress', 
      label: 'Mark In Progress', 
      icon: Clock, 
      variant: 'secondary' as const 
    },
    { 
      id: 'mark_resolved', 
      label: 'Mark Resolved', 
      icon: Check, 
      variant: 'default' as const 
    },
    { 
      id: 'mark_high_priority', 
      label: 'Set High Priority', 
      icon: ArrowUp, 
      variant: 'destructive' as const 
    },
    { 
      id: 'mark_low_priority', 
      label: 'Set Low Priority', 
      icon: ArrowDown, 
      variant: 'outline' as const 
    },
    { 
      id: 'assign_batch', 
      label: 'Assign to Team', 
      icon: Users, 
      variant: 'outline' as const 
    }
  ];

  return (
    <Card className="p-4 border-primary/20 bg-primary/5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {selectedIssues.length} Selected
          </Badge>
          <span className="text-sm text-muted-foreground">
            Bulk Actions:
          </span>
        </div>

        <div className="flex items-center gap-2">
          {bulkActions.map(action => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant={action.variant}
                size="sm"
                onClick={() => onBulkAction(action.id, selectedIssues)}
                className="text-xs"
              >
                <Icon className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}