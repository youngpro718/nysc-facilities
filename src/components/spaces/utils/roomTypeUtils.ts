
import { StatusEnum, RoomTypeEnum } from "../rooms/types/roomEnums";

// Function to get status color
export const getStatusColor = (status: StatusEnum | string): string => {
  switch (status) {
    case StatusEnum.ACTIVE:
    case "active":
      return "bg-green-100 text-green-800 border-green-300";
    case StatusEnum.INACTIVE:
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case StatusEnum.UNDER_MAINTENANCE:
    case "under_maintenance":
      return "bg-amber-100 text-amber-800 border-amber-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

// Function to get room type color
export const getRoomTypeColor = (type: RoomTypeEnum | string): string => {
  switch (type) {
    case RoomTypeEnum.OFFICE:
    case "office":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case RoomTypeEnum.COURTROOM:
    case "courtroom":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case RoomTypeEnum.STORAGE:
    case "storage":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case RoomTypeEnum.MEETING:
    case "conference":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case RoomTypeEnum.UTILITY:
    case "utility":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case RoomTypeEnum.RECEPTION:
    case "reception":
      return "bg-pink-100 text-pink-800 border-pink-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

// Function to get a human-readable room type name
export const getRoomTypeName = (type: RoomTypeEnum | string): string => {
  switch (type) {
    case RoomTypeEnum.OFFICE:
    case "office":
      return "Office";
    case RoomTypeEnum.COURTROOM:
    case "courtroom":
      return "Courtroom";
    case RoomTypeEnum.STORAGE:
    case "storage":
      return "Storage";
    case RoomTypeEnum.MEETING:
    case "conference":
      return "Meeting Room";
    case RoomTypeEnum.UTILITY:
    case "utility":
      return "Utility";
    case RoomTypeEnum.RECEPTION:
    case "reception":
      return "Reception";
    default:
      return type.toString().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};
