
import { RoomConnectionData } from "../RoomFormSchema";

export interface SpaceOption {
  id: string;
  name: string;
  type: string;
  room_number?: string;
}

export interface ConnectionItemProps {
  connection: RoomConnectionData;
  index: number;
  spaceName: string;
  onRemove: (index: number) => void;
}

export interface NewConnectionFormProps {
  spaces?: SpaceOption[];
  isLoading: boolean;
  newConnection: RoomConnectionData;
  onConnectionChange: (field: keyof RoomConnectionData, value: string) => void;
  onAddConnection: () => void;
  onCancel: () => void;
}

export interface ConnectionFieldsProps {
  floorId: string;
  roomId?: string;
  connections: RoomConnectionData[];
  onAddConnection: (connection: RoomConnectionData) => void;
  onRemoveConnection: (index: number) => void;
}

export interface ConnectionTypes {
  direct: string;
  door: string;
  secured: string;
  transition: string;
}

export interface DirectionTypes {
  north: string;
  south: string;
  east: string;
  west: string;
  start: string;
  end: string;
  center: string;
  left: string;
  right: string;
}
