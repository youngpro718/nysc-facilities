
import { KeyAssignmentItem } from "./KeyAssignmentItem";

export interface KeyAssignment {
  id: string;
  assigned_at: string;
  returned_at?: string;
  is_spare: boolean;
  return_reason?: string;
  key: {
    id: string;
    name: string;
    type: string;
    is_passkey: boolean;
    key_door_locations?: { door_location: string }[];
  };
}

interface KeyAssignmentListProps {
  assignments: KeyAssignment[];
  onReturnKey: (assignmentId: string) => void;
}

export function KeyAssignmentList({ 
  assignments,
  onReturnKey
}: KeyAssignmentListProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Assigned Keys</h3>
      <div className="grid gap-3">
        {assignments.map((assignment) => (
          <KeyAssignmentItem
            key={assignment.id}
            assignment={assignment}
            onReturnKey={onReturnKey}
          />
        ))}
      </div>
    </div>
  );
}
