import { KeyAssignmentItem } from "./KeyAssignmentItem";
import type { KeyAssignment, KeyAssignmentListProps } from "./types";

// Types moved to types.ts to avoid circular dependency
// Re-export for backward compatibility
export type { KeyAssignment };

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
