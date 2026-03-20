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
  
  // Room intelligence
  room_size_category?: 'small' | 'medium' | 'large';
  persistent_issues?: RoomPersistentIssue;
  vacancy_status?: 'vacant' | 'occupied' | 'at_capacity';
  history_stats?: RoomHistoryStats;
  
  // Quick calculated stats
  has_persistent_issues?: boolean;
}
