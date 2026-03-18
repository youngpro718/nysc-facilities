import { Room } from "./RoomTypes";

export interface CourtroomLayoutDetails {
  defense_table?: {
    length_in?: number;
    depth_in?: number;
    seats?: number;
  };
  prosecution_table?: {
    length_in?: number;
    depth_in?: number;
    seats?: number;
  };
  notes?: string;
}

export interface CourtRoomData {
  id: string;
  room_id: string;
  room_number: string;
  courtroom_number?: string;
  juror_capacity: number;
  spectator_capacity: number;
  accessibility_features: {
    wheelchair_accessible: boolean;
    hearing_assistance: boolean;
    visual_aids: boolean;
  };
  maintenance_status: string;
  is_active: boolean;
  layout_details?: CourtroomLayoutDetails;
}

export interface LightingFixtureStatus {
  id: string;
  room_id: string;
  fixture_name: string;
  location: string;
  status: 'functional' | 'out' | 'flickering' | 'maintenance';
  reported_out_date?: string;
  ballast_issue: boolean;
  last_serviced?: string;
  outage_duration_days?: number;
}

export interface RoomPersistentIssue {
  room_id: string;
  issue_count: number;
  open_issues: number;
  latest_issue_date: string;
}

export interface RoomHistoryStats {
  total_issues: number;
  unique_occupants: number;
  current_occupants: number;
  last_issue_date?: string;
}

export interface EnhancedRoom extends Room {
  // Courtroom data
  court_room?: CourtRoomData;
  
  // Lighting data
  lighting_fixtures?: LightingFixtureStatus[];
  total_fixtures_count?: number;
  functional_fixtures_count?: number;
  
  // Room intelligence
  room_size_category?: 'small' | 'medium' | 'large';
  persistent_issues?: RoomPersistentIssue;
  vacancy_status?: 'vacant' | 'occupied' | 'at_capacity';
  history_stats?: RoomHistoryStats;
  
  // Quick calculated stats
  lighting_percentage?: number;
  has_lighting_issues?: boolean;
  has_persistent_issues?: boolean;
}

export interface LightingIssueReport {
  room_id: string;
  fixture_id?: string;
  fixture_location: string;
  issue_type: 'light_out' | 'flickering' | 'ballast_issue' | 'maintenance_needed';
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reported_by?: string;
}