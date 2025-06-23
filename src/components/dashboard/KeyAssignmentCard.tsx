
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, DoorOpen } from "lucide-react";
import { useKeyAssignments } from "@/components/occupants/hooks/useKeyAssignments";

interface KeyAssignmentCardProps {
  userId: string;
}

export function KeyAssignmentCard({ userId }: KeyAssignmentCardProps) {
  const { keyAssignments, isLoading } = useKeyAssignments(userId);

  const totalDoorAccess = keyAssignments?.reduce((count, assignment) => {
    if (assignment.keys?.is_passkey) return count + 5;
    return count + (assignment.keys?.key_door_locations_table?.length || 1);
  }, 0) || 0;

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg sm:text-2xl font-semibold">Key Assignments</h2>
        </div>
        <Badge variant="secondary" className="font-normal">
          {keyAssignments?.length || 0} keys
        </Badge>
      </div>
      
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        ) : keyAssignments && keyAssignments.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span>{keyAssignments.length} Keys Assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <span>{totalDoorAccess} Door Access</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {keyAssignments.slice(0, 3).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                >
                  <span>{assignment.keys?.name || 'Unknown Key'}</span>
                  {assignment.keys?.is_passkey && (
                    <Badge variant="secondary" className="text-xs">
                      Passkey
                    </Badge>
                  )}
                </div>
              ))}
              {keyAssignments.length > 3 && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  +{keyAssignments.length - 3} more keys
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Key className="h-8 w-8" />
            <p>No keys assigned</p>
          </div>
        )}
      </div>
    </Card>
  );
}
