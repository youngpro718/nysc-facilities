
// Database connection types
export type Direction = 'adjacent' | 'left_of_hallway' | 'right_of_hallway';
export type Position = 'adjacent' | 'custom';
export type ConnectionType = 'room' | 'hallway' | 'door';  // Changed this to match UI types
export type ConnectionStatus = 'active' | 'inactive';

export interface Connection {
  id: string;
  from_space_id: string;
  to_space_id: string;
  space_type: string;
  connection_type: ConnectionType;
  direction: Direction;
  position: Position;
  status: ConnectionStatus;
  hallway_position?: number | null;
  offset_distance?: number | null;
  to_space?: {
    name: string;
    room_number?: string | null;
    type: string;
  };
  connectedSpaceName?: string;
}

export interface SpatialAssignment {
  id: string;
  sequence_number: number;
  position: string;
  space_type: string;
}

export interface CreateConnectionData {
  spaceId: string;
  connectionType: ConnectionType;
  roomId?: string;
  hallwayId?: string;
  doorId?: string;
  direction?: Direction;
  position?: Position;
  hallwayPosition?: number;
  offsetDistance?: number;
}

export interface BaseConnectionFormProps {
  onConnect: (data: CreateConnectionData) => void;
  isLoading: boolean;
}
