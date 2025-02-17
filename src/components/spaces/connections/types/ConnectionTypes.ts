
// Database connection types
export type Direction = 'adjacent' | 'left_of_hallway' | 'right_of_hallway';
export type Position = 'adjacent' | 'custom';
export type ConnectionType = 'direct' | 'door';
export type ConnectionStatus = 'active' | 'inactive';

// UI connection types 
export type UIConnectionType = 'room' | 'hallway' | 'door';

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
  connectionType?: UIConnectionType;
}

export interface CreateConnectionData {
  spaceId: string;
  connectionType: UIConnectionType;
  roomId?: string;
  hallwayId?: string;
  doorId?: string;
  direction?: Direction;
  position?: Position;
  hallwayPosition?: number;
  offsetDistance?: number;
}

export interface BaseConnectionFormProps {
  onConnect: (data: any) => void;
  isLoading: boolean;
}
