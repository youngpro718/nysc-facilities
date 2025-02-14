
// Base occupant type
export type Occupant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  title: string | null;
  status: string | null;
  room_count?: number;
  key_count?: number;
};

export type RoomReference = {
  id: string;
  name: string;
  room_number: string;
  assignment_type: 'primary_office' | 'work_location' | 'support_space';
  is_primary: boolean;
  schedule: {
    days: string[];
    hours: string | null;
  } | null;
  notes: string | null;
  floors: {
    name: string;
    buildings: {
      name: string;
    };
  };
  related_rooms?: {
    room_id: string;
    room_name: string;
    relationship_type: 'chamber_courtroom' | 'courtroom_robing' | 'office_courtroom';
  }[];
};

// Extended type for occupant details
export type OccupantQueryResponse = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  title: string | null;
  status: string;
  room_count: number;
  key_count: number;
  rooms: RoomReference[] | null;
};

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}
