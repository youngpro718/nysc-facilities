
export enum StatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
  UNDER_MAINTENANCE = "under_maintenance"
}

export enum RoomTypeEnum {
  OFFICE = "office",
  COURTROOM = "courtroom",
  JUDGES_CHAMBERS = "judges_chambers",
  JURY_ROOM = "jury_room",
  CONFERENCE_ROOM = "conference_room",
  FILING_ROOM = "filing_room",
  MALE_LOCKER_ROOM = "male_locker_room",
  FEMALE_LOCKER_ROOM = "female_locker_room",
  ROBING_ROOM = "robing_room",
  STAKE_HOLDER = "stake_holder",
  MEETING = "conference", // Changed to match expected value
  STORAGE = "storage",
  CHAMBERS = "chambers",
  RECEPTION = "reception",
  BREAKROOM = "breakroom",
  LIBRARY = "library",
  UTILITY = "utility",
  SPECIAL = "special"
}

export enum StorageTypeEnum {
  GENERAL = "general",
  SECURE = "secure",
  CLIMATE_CONTROLLED = "climate_controlled",
  HAZARDOUS = "hazardous",
  ARCHIVE = "archive"
}

// Type for database-acceptable room types
export type RoomTypeString = 
  | "office"
  | "courtroom"
  | "judges_chambers"
  | "jury_room"
  | "conference_room"
  | "filing_room"
  | "male_locker_room"
  | "female_locker_room"
  | "robing_room"
  | "stake_holder"
  | "conference"
  | "storage"
  | "chambers"
  | "reception"
  | "breakroom"
  | "library"
  | "utility"
  | "special";

export type StatusString = "active" | "inactive" | "under_maintenance";
export type StorageTypeString = "general" | "secure" | "climate_controlled" | "hazardous" | "archive";

// Helper functions for string conversions
export const statusToString = (status: StatusEnum): StatusString => status;
export const stringToStatus = (str: string): StatusEnum => str as StatusEnum;

export const roomTypeToString = (type: RoomTypeEnum): RoomTypeString => type;
export const stringToRoomType = (str: string): RoomTypeEnum => str as RoomTypeEnum;

export const storageTypeToString = (type: StorageTypeEnum): StorageTypeString => type;
export const stringToStorageType = (str: string): StorageTypeEnum => str as StorageTypeEnum;
