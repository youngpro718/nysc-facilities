
export type ConnectionType = "room" | "hallway" | "door";
export type Direction = "north" | "south" | "east" | "west" | "adjacent";
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
  direction?: string;
  position?: string;
  status: ConnectionStatus;
  metadata: Record<string, any>;
  to_space?: {
    name: string;
    room_number?: string;
    type?: string;
  };
}

