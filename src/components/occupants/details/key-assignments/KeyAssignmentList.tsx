
import { KeyAssignmentItem } from "./KeyAssignmentItem";
import type { KeyAssignment } from "../KeyAssignmentSection";

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
