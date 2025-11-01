
import type { UserRole } from '@/config/roles';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_approved?: boolean;
  access_level?: 'none' | 'read' | 'write' | 'admin'; // Legacy - being phased out
  role?: UserRole | string; // NEW: The actual role from user_roles table
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
  onboarding_completed?: boolean;
  onboarding_skipped?: boolean;
  onboarding_completed_at?: string;
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
