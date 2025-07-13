
import { useVerificationMutation } from "./mutations/useVerificationMutation";
import { useEnhancedAdminMutation } from "./mutations/useEnhancedAdminMutation";
import { useUserDeletionMutation } from "./mutations/useUserDeletionMutation";
import type { Department, SelectedUser } from "./types/verificationTypes";

export function useVerificationMutations(
  departments: Department[] | undefined,
  refetchUsers: () => void
) {
  const { handleVerification, handleBulkVerification } = useVerificationMutation(departments, refetchUsers);
  const { handleToggleAdmin } = useEnhancedAdminMutation(refetchUsers);
  const { handleDeleteUser } = useUserDeletionMutation(refetchUsers);

  return {
    handleVerification,
    handleBulkVerification,
    handleToggleAdmin,
    handleDeleteUser
  };
}

export type { Department, SelectedUser };
