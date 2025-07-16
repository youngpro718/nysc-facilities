
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Key, DoorOpen, Eye } from "lucide-react";
import { useKeyAssignments } from "@/components/occupants/hooks/useKeyAssignments";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface KeyAssignmentCardProps {
  userId: string;
}

export function KeyAssignmentCard({ userId }: KeyAssignmentCardProps) {
  const { keyAssignments, isLoading } = useKeyAssignments(userId);
  const navigate = useNavigate();

  const totalDoorAccess = keyAssignments?.reduce((count, assignment) => {
    if (assignment.keys?.is_passkey) return count + 5;
    return count + 1; // Default door access count per key
  }, 0) || 0;

  const handleViewAllKeys = () => {
    navigate('/my-requests');
  };

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg sm:text-2xl font-semibold">Key Assignments</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {keyAssignments?.length || 0} keys
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAllKeys}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            View All
          </Button>
        </div>
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
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{assignment.keys?.name || 'Unknown Key'}</div>
                    <div className="text-xs text-muted-foreground">
                      Assigned {format(new Date(assignment.assigned_at), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.keys?.is_passkey && (
                      <Badge variant="secondary" className="text-xs">
                        Passkey
                      </Badge>
                    )}
                  </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAllKeys}
              className="mt-2"
            >
              Request New Key
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
