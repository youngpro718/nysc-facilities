import { KeyAssignment } from "./KeyAssignmentList";

interface KeyAssignmentItemProps {
  assignment: KeyAssignment;
  onReturnKey: (assignmentId: string) => void;
}

export function KeyAssignmentItem({ assignment, onReturnKey }: KeyAssignmentItemProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
      <span>{assignment.key.name}</span>
      <div className="flex items-center gap-2">
        {assignment.key.is_passkey && (
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
            Passkey
          </span>
        )}
        {!assignment.returned_at && (
          <button
            onClick={() => onReturnKey(assignment.id)}
            className="text-xs text-destructive hover:text-destructive/80"
          >
            Return
          </button>
        )}
      </div>
    </div>
  );
}
