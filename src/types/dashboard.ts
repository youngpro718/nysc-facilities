
export interface RoomData {
  id: string;
  assigned_at: string;
  rooms: {
    name: string | null;
  } | null;
}

export interface KeyData {
  id: string;
  assigned_at: string;
  keys: {
    name: string | null;
  } | null;
}

export interface UserAssignment {
  id: string;
  key_name?: string;
  room_name?: string;
  room_number?: string;
  building_name?: string;
  floor_name?: string;
  is_primary?: boolean;
  assigned_at: string;
  key_type?: 'standard' | 'restricted' | 'master';
  access_areas?: string;
  expiry_date?: string;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  occupant_count?: number; // Added for room occupant count
  room_status?: string;    // Added for room status
  assignment_type?: string; // Added for assignment type
}

export interface UserIssue {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  priority: "low" | "medium" | "high";
  building_id: string;
  seen: boolean;
  photos?: string[];
  rooms?: {
    id: string;
    name: string;
    room_number: string;
  } | null;
  buildings?: {
    name: string;
  } | null;
  floors?: {
    name: string;
  } | null;
}

export interface UserProfile {
  id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  avatar_url?: string;
}

export interface Building {
  id: string;
  name: string;
  status: "active" | "inactive" | "under_maintenance";
  address: string;
  created_at: string;
  updated_at: string;
  building_floors?: {
    id: string;
    name: string;
    floor_number: number;
  }[];
}

export interface Activity {
  id: string;
  action: string;
  activity_type?: string;
  performed_by?: string;
  created_at: string;
  metadata?: {
    building_id: string;
    [key: string]: any;
  };
}

export interface AdminDashboardData {
  buildings: Building[];
  buildingsLoading: boolean;
  issues: UserIssue[];
  activities: Activity[];
  handleMarkAsSeen: (id: string) => void;
}

