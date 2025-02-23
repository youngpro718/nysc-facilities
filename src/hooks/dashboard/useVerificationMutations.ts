
import { useVerificationMutation } from "./mutations/useVerificationMutation";
import { useAdminMutation } from "./mutations/useAdminMutation";
import { useUserDeletionMutation } from "./mutations/useUserDeletionMutation";
import type { Department, SelectedUser } from "./types/verificationTypes";

export function useVerificationMutations(
  departments: Department[] | undefined,
  refetchUsers: () => void
) {
  const { handleVerification, handleBulkVerification } = useVerificationMutation(departments, refetchUsers);
  const { handleToggleAdmin } = useAdminMutation(refetchUsers);
  const { handleDeleteUser } = useUserDeletionMutation(refetchUsers);

  return {
    handleVerification,
    handleBulkVerification,
    handleToggleAdmin,
    handleDeleteUser
  };
}

export type { Department, SelectedUser };
