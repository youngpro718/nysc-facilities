
// Base occupant type
export type Occupant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  title: string | null;
  role: string | null;
  court_position?: string | null;
  status: string;
  employment_type?: string | null;
  supervisor_id?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  emergency_contact?: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
    alternate_phone: string | null;
    email: string | null;
  } | null;
  notes?: string | null;
  access_level?: string;
  room_count?: number;
  key_count?: number;
};

// Extended type for occupant details
export type OccupantDetails = Occupant & {
  rooms?: RoomDetails;
};

export interface RoomDetails {
  id?: string;
  name: string;
  room_number: string;
  assignment_type?: string;
  assignment_id?: string;
  is_primary?: boolean;
  schedule?: string;
  notes?: string;
  connections?: Array<{ name: string }>;
  floors?: {
    name: string;
    buildings?: {
      name: string;
    };
  };
}

export type OccupantQueryResponse = Occupant & {
  rooms: RoomDetails[];
};

export interface OccupantAssignments {
  rooms: string[];
  keys: string[];
}

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}
