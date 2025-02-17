export interface RoomConnection {
  id: string;
  direction?: "north" | "south" | "east" | "west" | "adjacent";
  to_space?: {
    id: string;
    name: string;
    type?: string;
  };
  from_space?: {
    id: string;
    name: string;
    type?: string;
  };
  connection_type?: string;
  status?: string;
  position?: string;
  hallway_position?: number;
  offset_distance?: number;
}

export type RoomType = "courtroom" | "judges_chambers" | "jury_room" | "conference_room" | 
  "office" | "filing_room" | "male_locker_room" | "female_locker_room" | "robing_room" | 
  "stake_holder" | "records_room" | "administrative_office" | "break_room" | "it_room" | 
  "utility_room";

export type StorageType = "file_storage" | "equipment_storage" | "supply_storage" | 
  "evidence_storage" | "record_storage" | "general_storage";

export type IssueType = string;

export interface RoomIssue {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved";
  type: string;
  priority: string;
  created_at: string;
}

export interface RoomHistoryEntry {
  change_type: string;
  previous_values?: any;
  new_values?: any;
  created_at: string;
}

export interface RoomOccupant {
  first_name: string;
  last_name: string;
  title?: string;
}

export interface Room {
  id: string;
  name: string;
  room_number: string;
  room_type: RoomType;
  description?: string;
  status: "active" | "inactive" | "under_maintenance";
  floor_id: string;
  parent_room_id?: string;
  is_storage: boolean;
  storage_capacity?: number | null;
  storage_type?: StorageType | null;
  storage_notes?: string;
  phone_number?: string;
  created_at: string;
  current_function?: string;
  previous_functions?: any[];
  function_change_date?: string;
  occupant_count?: number;
  current_occupants?: RoomOccupant[];
  floors?: {
    name: string;
    buildings?: {
      id: string;
      name: string;
    };
  };
  parent_room?: {
    name: string;
  };
  space_connections?: RoomConnection[];
  issues?: RoomIssue[];
  room_history?: RoomHistoryEntry[];
  lighting_fixture?: {
    id: string;
    type: "standard" | "emergency" | "motion_sensor";
    status: "functional" | "maintenance_needed" | "non_functional" | "pending_maintenance" | "scheduled_replacement";
    technology?: "LED" | "Fluorescent" | "Bulb" | null;
    electrical_issues?: {
      short_circuit: boolean;
      wiring_issues: boolean;
      voltage_problems: boolean;
    };
    ballast_issue?: boolean;
    maintenance_notes?: string;
  } | null;
}
