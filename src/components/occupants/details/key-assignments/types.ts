/**
 * Shared types for KeyAssignment components
 * Extracted to avoid circular dependencies
 */

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

export interface KeyAssignmentItemProps {
  assignment: KeyAssignment;
  onReturnKey: (assignmentId: string) => void;
}

export interface KeyAssignmentListProps {
  assignments: KeyAssignment[];
  onReturnKey: (assignmentId: string) => void;
}
