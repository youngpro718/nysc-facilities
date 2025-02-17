
// These types must match the database enums exactly
export type ConnectionType = "room" | "hallway" | "door";
export type Direction = "north" | "south" | "east" | "west" | "adjacent" | "left_of_hallway" | "right_of_hallway";
export type ConnectionStatus = "active" | "inactive" | "under_maintenance";
export type Position = "start" | "middle" | "end" | "adjacent";

export interface BaseConnectionFormProps {
  onConnect: (data: any) => void;
  isLoading: boolean;
}

export interface Connection {
  id: string;
  from_space_id: string;
  to_space_id: string;
  space_type: string;
  connection_type: string;
  status: ConnectionStatus;
  direction?: Direction;
  position?: Position;
  hallway_position?: number;
  offsetDistance?: number;
  to_space?: {
    name: string;
    room_number?: string;
    type?: string;
  };
}

export interface FormOption {
  value: string;
  label: string;
}

export type SpaceConnection = Connection;
