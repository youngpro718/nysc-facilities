
export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  theme: 'light' | 'dark';
  department: string | null;
  last_login_at: string | null;
  notification_preferences: {
    email: {
      issues: boolean;
      maintenance: boolean;
      system_updates: boolean;
    };
    push: {
      issues: boolean;
      maintenance: boolean;
      system_updates: boolean;
    };
    alert_preferences: {
      priority_threshold: string;
      maintenance_reminders: boolean;
      system_updates: boolean;
    };
  } | null;
  updated_at: string;
  created_at: string;
  phone: string | null;
  department_id: string | null;
  access_level: 'none' | 'read' | 'write' | 'admin' | null;
  verification_status: 'pending' | 'approved' | 'rejected' | null;
  is_approved: boolean;
  feature_flags: Record<string, any> | null;
  interface_preferences: {
    theme: string;
    notifications: boolean;
  } | null;
  system_preferences: Record<string, any> | null;
  security_settings: Record<string, any> | null;
  accessibility_preferences: Record<string, any> | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  email: string | null;
  time_zone: string | null;
  language: string | null;
  title: string | null;
  emergency_contact: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  } | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      verification_requests: {
        Row: {
          id: string;
          user_id: string | null;
          status: 'pending' | 'approved' | 'rejected';
          department: string | null;
          submitted_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          department_id: string | null;
          agency_id: string | null;
          supporting_documents: string[] | null;
          employee_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['verification_requests']['Row'], 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Database['public']['Tables']['verification_requests']['Row'], 'id'>>;
      };
    };
  };
}
