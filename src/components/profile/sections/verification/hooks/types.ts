
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Department {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  status: RequestStatus;
  submitted_at: string;
  department_id?: string | null;
  is_admin: boolean;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    verification_status: VerificationStatus;
    department_id?: string | null;
  }
}

export interface UserVerificationView {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
  verification_status: VerificationStatus | null;
  department_id: string | null;
  profile_id: string;
}
