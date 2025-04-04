
import { RoomTypeEnum, StatusEnum } from "../rooms/types/roomEnums";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { ExtendedFormData } from "../schemas/extendedFormSchema";
import { FormData } from "../schemas/extendedFormSchema";

export function getInitialSpaceData(type: "room" | "hallway" | "door"): Partial<FormData> {
  const commonData = {
    type,
    name: "",
    status: StatusEnum.ACTIVE,
    description: "",
    buildingId: "",
    floorId: "",
    position: { x: 0, y: 0 },
    rotation: 0
  };

  if (type === "door") {
    return {
      ...commonData,
      doorType: "standard",
      securityLevel: "standard",
      passkeyEnabled: false,
      // Extended properties used in forms
      hardwareStatus: {
        hinges: "functional",
        lock: "functional",
        frame: "functional",
        doorknob: "functional"
      },
      closerStatus: "functioning",
      windPressureIssues: false,
      // Additional door properties
      hasClosingIssue: false,
      hasHandleIssue: false,
      size: { width: 60, height: 20 }
    };
  }

  if (type === "hallway") {
    return {
      ...commonData,
      section: "connector",
      hallwayType: "public_main",
      trafficFlow: "two_way",
      accessibility: "fully_accessible",
      emergencyRoute: "not_designated",
      maintenancePriority: "low",
      capacityLimit: 50,
      // Extended properties
      maintenanceSchedule: [],
      emergencyExits: [],
      size: { width: 300, height: 50 }
    } as Partial<FormData>;
  }

  return {
    ...commonData,
    type: "room",
    roomNumber: "",
    roomType: RoomTypeEnum.OFFICE,
    currentFunction: "",
    isStorage: false,
    size: { width: 150, height: 100 }
  };
}
