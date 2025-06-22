
import { StatusEnum, RoomTypeEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

export interface Room {
  id: string;
  name: string;
  roomNumber?: string;
  roomType: RoomTypeEnum;
  description?: string;
  status: StatusEnum;
  floorId: string;
  floorName: string;
  buildingName: string;
  buildingId: string;
  isStorage?: boolean;
  storageType?: StorageTypeEnum;
  storageCapacity?: number;
  phoneNumber?: string;
  currentFunction?: string;
  occupants?: RoomOccupant[];
  issues?: RoomIssue[];
  history?: RoomHistoryItem[];
  lightingFixtures?: LightingFixture[];
  connections?: RoomConnection[];
  parentRoomId?: string;
  parentRoomName?: string;
  courtroom_photos?: {
    judge_view: string | null;
    audience_view: string | null;
  } | null;
}

export interface RoomOccupant {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  assignmentType: string;
  isPrimary: boolean;
  schedule?: string;
}

export interface RoomIssue {
  id: string;
  title: string;
  status: string;
  type: string;
  priority: string;
  createdAt: string;
}

export interface RoomHistoryItem {
  id: string;
  changeType: string;
  previousValues?: any;
  newValues?: any;
  createdAt: string;
}

export interface LightingFixture {
  id: string;
  name: string;
  status: string;
  type?: string;
  position?: string;
  technology?: string;
}

export interface RoomConnection {
  id: string;
  fromSpaceId: string;
  toSpaceId: string;
  connectionType: string;
  direction?: string;
  status: string;
  toSpace?: {
    id: string;
    name: string;
    type: string;
  };
}
