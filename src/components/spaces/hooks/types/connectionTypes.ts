
import { Connection, Direction, Position, ConnectionStatus } from "../../connections/types/ConnectionTypes";

// This represents the UI-level connection type
export type UIConnectionType = "room" | "hallway" | "door";

// This represents what's actually stored in the database
export type DBConnectionType = "direct" | "door" | "secured";

export interface CreateConnectionData {
  spaceId: string;
  roomId?: string;
  hallwayId?: string;
  doorId?: string;
  direction?: Direction;
  connectionType: UIConnectionType;
  position?: Position;
  hallwayPosition?: number;
  offsetDistance?: number;
}
