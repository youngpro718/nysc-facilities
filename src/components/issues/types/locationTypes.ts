
export interface Building {
  id: string;
  name: string;
  status: string;
}

export interface Floor {
  id: string;
  name: string;
  floor_number: number;
  status: string;
}

export interface Room {
  id: string;
  name: string;
  room_number: string;
  status: string;
}
