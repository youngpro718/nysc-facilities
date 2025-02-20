
import { DoorFormData, HallwayFormData, RoomFormData, EditSpaceFormData } from "../schemas/editSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../rooms/types/roomEnums";

export const getInitialDoorData = (floorId: string): Partial<DoorFormData> => ({
  type: "door",
  floorId,
  status: StatusEnum.ACTIVE,
  doorType: "standard",
  isTransitionDoor: false,
  hasClosingIssue: false,
  hasHandleIssue: false,
  windPressureIssues: false,
  position: { x: 0, y: 0 },
  size: { width: 150, height: 100 },
  rotation: 0,
  passkeyEnabled: false,
  maintenanceHistory: [],
  hardwareStatus: {
    hinges: "functional",
    doorknob: "functional",
    lock: "functional",
    frame: "functional"
  }
});

export const getInitialHallwayData = (floorId: string): Partial<HallwayFormData> => ({
  type: "hallway",
  floorId,
  status: StatusEnum.ACTIVE,
  hallwayType: "public_main",
  section: "connector",
  trafficFlow: "two_way",
  accessibility: "fully_accessible",
  emergencyRoute: "not_designated",
  position: { x: 0, y: 0 },
  size: { width: 150, height: 100 },
  rotation: 0,
  maintenancePriority: "low",
  emergencyExits: [],
  maintenanceSchedule: []
});

export const getInitialRoomData = (floorId: string): Partial<RoomFormData> => ({
  type: "room",
  floorId,
  status: StatusEnum.ACTIVE,
  roomType: RoomTypeEnum.OFFICE,
  isStorage: false,
  position: { x: 0, y: 0 },
  size: { width: 150, height: 100 },
  rotation: 0,
});

export const getSpaceData = (type: string, floorId: string): Partial<EditSpaceFormData> => {
  switch (type) {
    case "room":
      return {
        ...getInitialRoomData(floorId),
        roomType: RoomTypeEnum.OFFICE,
        isStorage: false,
        position: { x: 0, y: 0 },
        size: { width: 150, height: 100 },
        rotation: 0,
      };
    case "door":
      return {
        ...getInitialDoorData(floorId),
        doorType: "standard",
        isTransitionDoor: false,
        position: { x: 0, y: 0 },
        size: { width: 50, height: 100 },
        rotation: 0,
      };
    case "hallway":
      return {
        ...getInitialHallwayData(floorId),
        hallwayType: "public_main",
        section: "connector",
        trafficFlow: "two_way",
        accessibility: "fully_accessible",
        emergencyRoute: "not_designated",
        position: { x: 0, y: 0 },
        size: { width: 150, height: 100 },
        rotation: 0,
      };
    default:
      throw new Error(`Unknown space type: ${type}`);
  }
};

export const getStorageTypes = () => Object.values(StorageTypeEnum);
export const getRoomTypes = () => Object.values(RoomTypeEnum);
