
import { RoomTypeEnum } from "../rooms/types/roomEnums";

/**
 * Gets a human-readable display name for a room type
 */
export const getRoomTypeDisplayName = (roomType: RoomTypeEnum | string): string => {
  switch (roomType) {
    case RoomTypeEnum.OFFICE:
      return "Office";
    case RoomTypeEnum.COURTROOM:
      return "Courtroom";
    case RoomTypeEnum.JUDGES_CHAMBERS:
      return "Judge's Chambers";
    case RoomTypeEnum.JURY_ROOM:
      return "Jury Room";
    case RoomTypeEnum.CONFERENCE_ROOM:
      return "Conference Room";
    case RoomTypeEnum.FILING_ROOM:
      return "Filing Room";
    case RoomTypeEnum.MALE_LOCKER_ROOM:
      return "Male Locker Room";
    case RoomTypeEnum.FEMALE_LOCKER_ROOM:
      return "Female Locker Room";
    case RoomTypeEnum.ROBING_ROOM:
      return "Robing Room";
    case RoomTypeEnum.STAKE_HOLDER:
      return "Stakeholder Room";
    case RoomTypeEnum.MEETING:
      return "Meeting Room";
    case RoomTypeEnum.STORAGE:
      return "Storage Room";
    case RoomTypeEnum.CHAMBERS:
      return "Chambers";
    case RoomTypeEnum.RECEPTION:
      return "Reception";
    case RoomTypeEnum.BREAKROOM:
      return "Break Room";
    case RoomTypeEnum.LIBRARY:
      return "Library";
    case RoomTypeEnum.UTILITY:
      return "Utility Room";
    case RoomTypeEnum.SPECIAL:
      return "Special Room";
    case RoomTypeEnum.LABORATORY:
      return "Laboratory";
    default:
      return String(roomType).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
};

/**
 * Gets icon class or identifier for a room type
 */
export const getRoomTypeIcon = (roomType: RoomTypeEnum | string): string => {
  switch (roomType) {
    case RoomTypeEnum.OFFICE:
      return "briefcase";
    case RoomTypeEnum.COURTROOM:
      return "gavel";
    case RoomTypeEnum.STORAGE:
      return "archive";
    case RoomTypeEnum.MEETING:
    case RoomTypeEnum.CONFERENCE_ROOM:
      return "users";
    case RoomTypeEnum.RECEPTION:
      return "info";
    case RoomTypeEnum.LIBRARY:
      return "book";
    case RoomTypeEnum.UTILITY:
      return "tool";
    default:
      return "home";
  }
};
