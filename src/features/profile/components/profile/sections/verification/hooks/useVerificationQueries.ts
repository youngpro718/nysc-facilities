
import { mapVerificationStatusToRequestStatus } from "../utils/statusMapping";
import type { VerificationRequest } from "./types";
import { useDepartments } from "./useDepartments";
import { useVerificationUsers } from "./useVerificationUsers";
import { useAdminRoles } from "./useAdminRoles";

export function useVerificationQueries() {
  const { departments, isLoadingDepartments } = useDepartments();
  const { users, isLoadingUsers, refetchUsers } = useVerificationUsers();
  const { adminRoles } = useAdminRoles();

  const verificationRequests: VerificationRequest[] = users?.map(user => ({
    id: user.id,
    user_id: user.id,
    department_id: user.department_id,
    status: mapVerificationStatusToRequestStatus(user.verification_status || 'pending'),
    submitted_at: user.created_at,
    profile: {
      id: user.profile_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      verification_status: user.verification_status || 'pending',
      department_id: user.department_id
    },
    is_admin: adminRoles?.includes(user.id) || false
  })) || [];

  return {
    departments,
    users,
    verificationRequests,
    isLoading: isLoadingDepartments || isLoadingUsers,
    refetchUsers
  };
}
