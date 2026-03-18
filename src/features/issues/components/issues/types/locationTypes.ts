export interface Building {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive' | 'under_maintenance';
  created_at: string;
  updated_at: string;
}

export interface Floor {
  id: string;
  name: string;
  building_id: string;
  floor_number: number;
  height: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  room_number: string;
  status: string;
}
