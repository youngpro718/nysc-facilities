
import { useState } from "react";

export function useVerificationState() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const clearSelections = () => {
    setSelectedUsers([]);
    setSelectedDepartment(null);
  };

  return {
    selectedUsers,
    setSelectedUsers,
    selectedDepartment,
    setSelectedDepartment,
    clearSelections,
  };
}
