
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../../rooms/types/roomEnums";

export interface RoomConnection {
  id?: string;
  toSpaceId?: string;
  connectionType?: string;
  direction?: string;
}

export interface BaseRoomData {
  id?: string;
  name?: string;
  type?: "room";
  roomNumber?: string;
  roomType?: RoomTypeEnum;
  status?: StatusEnum;
  description?: string;
  phoneNumber?: string;
  isStorage?: boolean;
  storageType?: StorageTypeEnum | null;
  storageCapacity?: number | null;
  storageNotes?: string;
  parentRoomId?: string | null;
  floorId?: string;
  buildingId?: string;
  currentFunction?: string;
  connections?: RoomConnection[];
  position?: {
    x?: number;
    y?: number;
  };
  size?: {
    width?: number;
    height?: number;
  };
  rotation?: number;
}
