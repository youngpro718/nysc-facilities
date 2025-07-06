import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Building2, Key, User, ArrowLeftRight } from "lucide-react";
import { useOccupantAccess } from "@/hooks/useOccupantAccess";
import { useKeyAssignments } from "@/components/occupants/hooks/useKeyAssignments";
import { format } from "date-fns";
import { toast } from "sonner";

interface OccupantDepartureViewProps {
  occupantId: string;
  onComplete?: () => void;
}

export function OccupantDepartureView({ occupantId, onComplete }: OccupantDepartureViewProps) {
  const { data: accessSummary, isLoading } = useOccupantAccess(occupantId);
  const { handleReturnKey } = useKeyAssignments(occupantId);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [returningKeys, setReturningKeys] = useState(false);

  const handleKeySelection = (keyAssignmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedKeys([...selectedKeys, keyAssignmentId]);
    } else {
      setSelectedKeys(selectedKeys.filter(id => id !== keyAssignmentId));
    }
  };

  const handleBulkReturn = async () => {
    if (selectedKeys.length === 0) {
      toast.error("Please select keys to return");
      return;
    }

    setReturningKeys(true);
    try {
      // Return keys one by one
      for (const keyId of selectedKeys) {
        await handleReturnKey(keyId);
      }
      
      setSelectedKeys([]);
      toast.success(`Successfully returned ${selectedKeys.length} keys`);
      onComplete?.();
    } catch (error) {
      console.error("Error returning keys:", error);
      toast.error("Failed to return some keys");
    } finally {
      setReturningKeys(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Loading Departure Summary...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!accessSummary) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2" />
          <p>Unable to load occupant information</p>
        </CardContent>
      </Card>
    );
  }

  const hasAssignments = accessSummary.room_assignments.length > 0 || accessSummary.key_assignments.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Departure Summary: {accessSummary.occupant_name}
          </CardTitle>
          {accessSummary.department && (
            <p className="text-sm text-muted-foreground">{accessSummary.department}</p>
          )}
        </CardHeader>
        {!hasAssignments && (
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2" />
              <p>No active room or key assignments found</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Room Assignments */}
      {accessSummary.room_assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Room Assignments ({accessSummary.room_assignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accessSummary.room_assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{assignment.room_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Room {assignment.room_number} • {assignment.building_name} • {assignment.floor_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Assigned {format(new Date(assignment.assigned_at), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.is_primary && (
                      <Badge variant="default">Primary</Badge>
                    )}
                    <Badge variant="outline">{assignment.assignment_type}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-foreground">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                These room assignments will need to be manually removed by an administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Assignments */}
      {accessSummary.key_assignments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Key Assignments ({accessSummary.key_assignments.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allKeyIds = accessSummary.key_assignments.map(k => k.id);
                    setSelectedKeys(selectedKeys.length === allKeyIds.length ? [] : allKeyIds);
                  }}
                >
                  {selectedKeys.length === accessSummary.key_assignments.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkReturn}
                  disabled={selectedKeys.length === 0 || returningKeys}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-1" />
                  {returningKeys ? 'Returning...' : `Return Selected (${selectedKeys.length})`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accessSummary.key_assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedKeys.includes(assignment.id)}
                    onCheckedChange={(checked) => handleKeySelection(assignment.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{assignment.key_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Assigned {format(new Date(assignment.assigned_at), "MMM d, yyyy")}
                    </div>
                    {assignment.door_access.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Access: {assignment.door_access.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.is_passkey && (
                      <Badge variant="secondary">Passkey</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}