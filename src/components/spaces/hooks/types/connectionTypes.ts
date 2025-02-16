
import { Connection, ConnectionType, Direction, Position, ConnectionStatus } from "../../connections/types/ConnectionTypes";

export interface CreateConnectionData {
  spaceId: string;
  roomId?: string;
  hallwayId?: string;
  doorId?: string;
  direction?: Direction;
  connectionType: ConnectionType;
  position?: Position;
  hallwayPosition?: number;
  offsetDistance?: number;
}
