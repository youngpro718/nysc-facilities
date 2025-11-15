
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";
import { StatusEnum } from "../rooms/types/roomEnums";

export const getInitialSpaceData = (type: "room" | "hallway" | "door"): Partial<CreateSpaceFormData> => {
  const baseData = {
    name: "",
    type,
    status: StatusEnum.ACTIVE,
    description: "",
  };

  switch (type) {
    case "door":
      return {
        ...baseData,
        hardwareStatus: {
          frame: "functional",
          hinges: "functional",
          doorknob: "functional",
          lock: "functional"
        },
        windPressureIssues: false
      };
    case "hallway":
      return {
        ...baseData,
        maintenanceSchedule: [],
        emergencyExits: []
      };
    default:
      return baseData;
  }
};
