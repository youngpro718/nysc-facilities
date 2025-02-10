
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

// Extended type for occupant details
export type OccupantDetails = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  title: string | null;
  status: string;
  room_count?: number;
  key_count?: number;
  rooms?: {
    name: string;
    room_number: string;
    floors?: {
      name: string;
      buildings?: {
        name: string;
      };
    };
  };
};

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
  rooms?: {
    name: string;
    room_number: string;
    floors?: {
      name: string;
      buildings?: {
        name: string;
      };
    };
  };
};

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}
