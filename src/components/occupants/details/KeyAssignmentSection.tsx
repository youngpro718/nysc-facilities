
import { KeyAssignmentSummary } from "./key-assignments/KeyAssignmentSummary";
import { KeyAssignmentList } from "./key-assignments/KeyAssignmentList";

export interface KeyAssignment {
  id: string;
  assigned_at: string;
  keys: {
    name: string;
    is_passkey: boolean;
    key_door_locations?: { door_location: string }[];
  };
}

interface KeyAssignmentSectionProps {
  keyAssignments: KeyAssignment[] | null;
  isLoading: boolean;
  onReturnKey: (assignmentId: string) => void;
}

export function KeyAssignmentSection({ 
  keyAssignments, 
  isLoading, 
  onReturnKey 
}: KeyAssignmentSectionProps) {
  const calculateDoorAccess = (assignment: KeyAssignment) => {
    if (assignment.keys?.is_passkey) {
      return 5;
    }
    return assignment.keys?.key_door_locations?.length || 1;
  };

  const totalDoorAccess = keyAssignments?.reduce((count, assignment) => {
    return count + calculateDoorAccess(assignment);
  }, 0) || 0;

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Access Information</h3>
      
      <KeyAssignmentSummary 
        totalKeys={keyAssignments?.length || 0}
        totalDoorAccess={totalDoorAccess}
      />

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      ) : keyAssignments && keyAssignments.length > 0 ? (
        <KeyAssignmentList 
          assignments={keyAssignments}
          onReturnKey={onReturnKey}
        />
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          No keys currently assigned
        </div>
      )}
    </div>
  );
}
