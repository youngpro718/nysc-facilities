
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
  connectedSpaceName: string;
  connectionType: string;
  status: ConnectionStatus;
  direction?: Direction;
  position?: Position;
  hallwayPosition?: number;
  offsetDistance?: number;
}

export interface FormOption {
  value: string;
  label: string;
}

export interface SpaceConnection {
  id: string;
  from_space_id: string;
  to_space_id: string;
  space_type: string;
  connection_type: string;
  direction?: Direction;
  position?: Position;
  status: ConnectionStatus;
  metadata: Record<string, any>;
  hallway_position?: number;
  offset_distance?: number;
  to_space?: {
    name: string;
    room_number?: string;
    type?: string;
  };
}
