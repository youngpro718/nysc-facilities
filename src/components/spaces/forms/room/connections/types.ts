
import { RoomConnectionData } from "../RoomFormSchema";
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../RoomFormSchema";

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
  floorId: string;
  roomId?: string;
  onSubmit: (connection: RoomConnectionData) => void;
  onCancel: () => void;
  spaces?: SpaceOption[];
  isLoading?: boolean;
}

export interface ConnectionFieldsProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  roomId?: string;
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

export interface SelectableOption {
  id: string;
  value: string;
  label: string;
  disabled?: boolean;
}
