
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
  username?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  avatar_url?: string;
}

export interface BuildingFloor {
  id: string;
  name: string;
  floor_number: number;
}

export interface LightingStats {
  total_fixtures: number;
  working_fixtures: number;
  non_working_fixtures: number;
}

export interface Building {
  id: string;
  name: string;
  status: "active" | "inactive" | "under_maintenance";
  address: string;
  created_at: string;
  updated_at: string;
  building_floors?: BuildingFloor[];
  lighting_stats?: LightingStats;
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
