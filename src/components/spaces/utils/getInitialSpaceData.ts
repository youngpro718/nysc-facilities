
import { EditSpaceFormData, CreateSpaceFormData } from "../schemas/editSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../rooms/types/roomEnums";

type InitialSpaceData = Partial<EditSpaceFormData>;

export const getInitialDoorData = (floorId: string): InitialSpaceData => ({
  type: "door",
  floorId,
  status: "active",
  doorType: "standard",
  securityLevel: "standard",
  passkeyEnabled: false,
  position: { x: 0, y: 0 },
  size: { width: 150, height: 100 },
  rotation: 0
});

export const getInitialHallwayData = (floorId: string): InitialSpaceData => ({
  type: "hallway",
  floorId,
  status: "active",
  hallwayType: "public_main",
  section: "connector",
  position: { x: 0, y: 0 },
  size: { width: 150, height: 100 },
  rotation: 0
});

export const getInitialRoomData = (floorId: string): InitialSpaceData => ({
  type: "room",
  floorId,
  status: "active",
  roomType: RoomTypeEnum.OFFICE,
  isStorage: false,
  position: { x: 0, y: 0 },
  size: { width: 150, height: 100 },
  rotation: 0,
});

export const getSpaceData = (type: "room" | "door" | "hallway", floorId: string): InitialSpaceData => {
  switch (type) {
    case "room":
      return getInitialRoomData(floorId);
    case "door":
      return getInitialDoorData(floorId);
    case "hallway":
      return getInitialHallwayData(floorId);
    default:
      throw new Error(`Unknown space type: ${type}`);
  }
};

export const getStorageTypes = () => Object.values(StorageTypeEnum);
export const getRoomTypes = () => Object.values(RoomTypeEnum);
