
import { useVerificationState } from "./useVerificationState";
import { useVerificationQueries } from "./useVerificationQueries";
import { useVerificationMutations } from "./useVerificationMutations";

export function useVerification() {
  const {
    selectedUsers,
    setSelectedUsers,
    selectedDepartment,
    setSelectedDepartment,
    clearSelections
  } = useVerificationState();

  const {
    departments,
    users,
    verificationRequests,
    isLoading,
    refetchUsers
  } = useVerificationQueries();

  const {
    handleVerification,
    handleBulkVerification,
    handleToggleAdmin,
    handleDeleteUser
  } = useVerificationMutations(departments, refetchUsers);

  return {
    // State
    selectedUsers,
    setSelectedUsers,
    selectedDepartment,
    setSelectedDepartment,
    
    // Data
    departments,
    users,
    verificationRequests,
    isLoading,
    
    // Actions
    handleVerification: (userId: string, approved: boolean) => 
      handleVerification(userId, approved, selectedDepartment),
    handleBulkVerification: (approve: boolean) => 
      handleBulkVerification(selectedUsers, approve, selectedDepartment),
    handleToggleAdmin,
    handleDeleteUser,
    clearSelections
  };
}

export type { 
  Department,
  VerificationStatus,
  RequestStatus,
  UserVerificationView,
  VerificationRequest
} from './types';
