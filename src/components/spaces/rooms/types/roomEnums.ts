
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
  STORAGE = "storage",
  BREAKROOM = "breakroom",
  LIBRARY = "library",
  UTILITY = "utility_room",
  SPECIAL = "special",
  IT_ROOM = "it_room",
  LABORATORY = "laboratory",
  CONFERENCE = "conference"
}

export enum StorageTypeEnum {
  GENERAL = "general",
  SECURE = "secure",
  CLIMATE_CONTROLLED = "climate_controlled",
  HAZARDOUS = "hazardous",
  ARCHIVE = "archive"
}

// This must match exactly the string literals accepted by the API
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
  | "storage"
  | "breakroom"
  | "library"
  | "utility_room"
  | "special"
  | "it_room"
  | "laboratory"
  | "conference";

export type StorageTypeString = 
  | "general"
  | "secure"
  | "climate_controlled"
  | "hazardous"
  | "archive";

// Export a union type for broader compatibility
export type RoomType = RoomTypeEnum | RoomTypeString;
export type StorageType = StorageTypeEnum | StorageTypeString;

// Helper to convert between enum and string types
export const roomTypeToString = (type: RoomType): RoomTypeString => {
  if (typeof type === 'string') {
    return type as RoomTypeString;
  }
  return type.toString() as RoomTypeString;
};

export const storageTypeToString = (type: StorageType): StorageTypeString => {
  if (typeof type === 'string') {
    return type as StorageTypeString;
  }
  return type.toString() as StorageTypeString;
};
