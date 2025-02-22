
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
  room_name?: string;
  key_name?: string;
  assigned_at: string;
}

export interface UserIssue {
  id: string;
  title: string;
  status: string;
  created_at: string;
  priority: string;
  rooms?: {
    name: string;
  } | null;
}

export interface UserProfile {
  username?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  avatar_url?: string;
}

// New types for admin dashboard
export interface Building {
  id: string;
  name: string;
  status: string;
  address: string;
}

export interface Activity {
  id: string;
  action: string;
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
