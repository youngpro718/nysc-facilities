
import type { VerificationStatus, RequestStatus } from "../hooks/types";

export const mapVerificationStatusToRequestStatus = (status: VerificationStatus): RequestStatus => {
  switch (status) {
    case 'verified':
      return 'approved';
    case 'rejected':
      return 'rejected';
    default:
      return 'pending';
  }
};
