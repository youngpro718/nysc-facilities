
import { RoomConnectionData } from "../RoomFormSchema";

export interface SpaceOption {
  id: string;
  name: string;
  type: string;
  room_number?: string;
}

export interface ConnectionFieldsProps {
  floorId: string;
  roomId?: string;
  connections: RoomConnectionData[];
  onAddConnection: (connection: RoomConnectionData) => void;
  onRemoveConnection: (index: number) => void;
}

export interface ConnectionsContainerProps {
  floorId: string;
  roomId?: string;
  form: any; // Using any here to avoid circular dependency with RoomFormProps
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
