
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
