export interface AdminStats {
  activeUsers: number;
  pendingIssues: number;
  totalKeys: number;
  managedBuildings: number;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
  [key: string]: string | undefined;
}

export interface Profile {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  title?: string;
  department?: string;
  last_login_at?: string;
  bio?: string;
  time_zone?: string;
  language?: string;
  emergency_contact?: EmergencyContact;
  email?: string;
  phone?: string;
}
