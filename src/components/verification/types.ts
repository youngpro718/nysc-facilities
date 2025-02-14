
export type VerificationRequest = {
  id: string;
  userId: string;
  agencyId: string;
  employeeId?: string;
  department?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  supportingDocuments: string[];
  createdAt: string;
  updatedAt: string;
};

export type Agency = {
  id: string;
  name: string;
  type: 'DCAS' | 'OCA' | 'EMPLOYEE';
};

export type VerificationFormData = {
  agencyId: string;
  employeeId: string;
  department: string;
  supportingDocuments: string[];
};
