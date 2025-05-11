
export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  avatar_url?: string;
  department_id?: string;
  title?: string;
  phone?: string;
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  metadata?: Record<string, any>;
}

export interface UserSignupData {
  first_name: string;
  last_name: string;
  title?: string;
  phone?: string;
  department_id?: string;
  court_position?: string;
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}
