
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { StatusEnum } from "../rooms/types/roomEnums";

export const getInitialSpaceData = (type: "room" | "hallway" | "door"): Partial<CreateSpaceFormData> => {
  // Base data common to all space types
  const baseData = {
    name: "",
    type,
    status: StatusEnum.ACTIVE,
    description: "",
    position: { x: 0, y: 0 },
    size: type === "hallway" 
          ? { width: 300, height: 50 } 
          : type === "door" 
            ? { width: 40, height: 10 }
            : { width: 150, height: 100 },
    rotation: 0
  };

  // Type-specific data
  switch (type) {
    case "door":
      return {
        ...baseData,
        doorType: "standard",
        securityLevel: "normal",
        passkeyEnabled: false,
        hardwareStatus: {
          frame: "functional",
          hinges: "functional",
          doorknob: "functional",
          lock: "functional"
        },
        closerStatus: "functional",
        windPressureIssues: false,
        maintenanceNotes: "",
        nextMaintenanceDate: null
      };
      
    case "hallway":
      return {
        ...baseData,
        section: "main",
        hallwayType: "public_main",
        trafficFlow: "two_way",
        accessibility: "fully_accessible",
        emergencyRoute: "not_designated",
        maintenancePriority: "normal",
        capacityLimit: 0,
        maintenanceSchedule: [],
        emergencyExits: []
      };
      
    default: // room
      return {
        ...baseData,
        roomType: "office",
        roomNumber: "",
        phoneNumber: "",
        currentFunction: "",
        isStorage: false,
        storageType: "",
        storageCapacity: 0,
        storageNotes: "",
        parentRoomId: null
      };
  }
};
