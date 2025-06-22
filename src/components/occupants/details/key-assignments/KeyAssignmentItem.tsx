
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export interface KeyAssignment {
  id: string;
  assigned_at: string;
  returned_at?: string;
  keys?: {
    name: string;
    is_passkey: boolean;
    key_door_locations?: Array<{
      door_location: string;
    }>;
  };
}

interface KeyAssignmentItemProps {
  assignment: KeyAssignment;
  onReturnKey: (assignmentId: string) => void;
}

export function KeyAssignmentItem({ 
  assignment,
  onReturnKey 
}: KeyAssignmentItemProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-background rounded-lg border gap-3">
      <div className="space-y-1">
        <div className="font-medium flex items-center gap-2 flex-wrap">
          <span className="truncate">{assignment.keys?.name}</span>
          {assignment.keys?.is_passkey && (
            <Badge variant="secondary">Passkey</Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Assigned: {format(new Date(assignment.assigned_at), "MMM d, yyyy")}
        </div>
        {assignment.keys?.key_door_locations && assignment.keys.key_door_locations.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <span className="block sm:inline">Access to: </span>
            <span className="truncate">
              {assignment.keys.key_door_locations
                .map(l => l.door_location || 'Unknown Location')
                .join(", ")}
            </span>
          </div>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className={isMobile ? "w-full" : ""}
        onClick={() => onReturnKey(assignment.id)}
      >
        Return Key
      </Button>
    </div>
  );
}
