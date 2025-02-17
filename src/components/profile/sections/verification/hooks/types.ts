
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  verification_status: VerificationStatus;
  department_id: string | null;
}

export interface UserVerificationView {
  id: string;
  department_name: string | null;
  created_at: string;
  updated_at: string;
  profile_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  verification_status: VerificationStatus;
  department_id: string | null;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  department_id: string | null;
  status: RequestStatus;
  submitted_at: string;
  profile: Profile | null;
}

export interface Department {
  id: string;
  name: string;
}
