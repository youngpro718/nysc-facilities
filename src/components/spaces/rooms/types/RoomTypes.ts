
export enum RoomType {
  COURTROOM = "courtroom",
  JUDGES_CHAMBERS = "judges_chambers",
  JURY_ROOM = "jury_room",
  CONFERENCE_ROOM = "conference_room",
  OFFICE = "office",
  FILING_ROOM = "filing_room",
  MALE_LOCKER_ROOM = "male_locker_room",
  FEMALE_LOCKER_ROOM = "female_locker_room",
  ROBING_ROOM = "robing_room",
  STAKE_HOLDER = "stake_holder",
  RECORDS_ROOM = "records_room",
  ADMINISTRATIVE_OFFICE = "administrative_office",
  BREAK_ROOM = "break_room",
  IT_ROOM = "it_room",
  UTILITY_ROOM = "utility_room"
}

export enum StorageType {
  FILE_STORAGE = "file_storage",
  EQUIPMENT_STORAGE = "equipment_storage",
  SUPPLY_STORAGE = "supply_storage",
  EVIDENCE_STORAGE = "evidence_storage",
  RECORD_STORAGE = "record_storage",
  GENERAL_STORAGE = "general_storage"
}

export interface RoomConnection {
  id: string;
  direction?: string;
  to_space?: {
    id: string;
    name: string;
    type: string;
  };
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
  storage_capacity: number | null;
  storage_type: StorageType | null;
  storage_notes?: string;
  phone_number?: string;
  created_at: string;
  current_function?: string;
  previous_functions?: any[];
  function_change_date?: string;
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
  space_connections: RoomConnection[];
  issues?: Array<{
    id: string;
    title: string;
    status: string;
    type: string;
    priority: string;
    created_at: string;
  }>;
  room_history?: any[];
  current_occupants?: Array<{
    first_name: string;
    last_name: string;
    title?: string;
  }>;
  lighting_fixture?: {
    id: string;
    type: string;
    status: string;
    technology: string;
    electrical_issues: boolean;
    ballast_issue: boolean;
    maintenance_notes?: string;
  } | null;
}
