
import { useState } from "react";

export interface SelectedUser {
  requestId: string;
  userId: string;
  name: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export function useVerificationState() {
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const clearSelections = () => {
    setSelectedUsers([]);
    setSelectedDepartment(null);
  };

  const getSelectedUserIds = () => selectedUsers.map(user => user.userId);
  const getSelectedRequestIds = () => selectedUsers.map(user => user.requestId);

  return {
    selectedUsers,
    setSelectedUsers,
    selectedDepartment,
    setSelectedDepartment,
    clearSelections,
    getSelectedUserIds,
    getSelectedRequestIds,
  };
}
