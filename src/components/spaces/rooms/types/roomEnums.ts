
export enum StatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
  UNDER_MAINTENANCE = "under_maintenance"
}

export enum RoomTypeEnum {
  OFFICE = "office",
  MEETING = "meeting",
  STORAGE = "storage",
  COURTROOM = "courtroom",
  CHAMBERS = "chambers",
  RECEPTION = "reception",
  BREAKROOM = "breakroom",
  LIBRARY = "library",
  UTILITY = "utility",
  SPECIAL = "special",
  // Additional types to match the expected string literals in the database
  JUDGES_CHAMBERS = "judges_chambers",
  JURY_ROOM = "jury_room",
  CONFERENCE_ROOM = "conference_room",
  FILING_ROOM = "filing_room",
  MALE_LOCKER_ROOM = "male_locker_room",
  FEMALE_LOCKER_ROOM = "female_locker_room",
  ROBING_ROOM = "robing_room",
  STAKE_HOLDER = "stake_holder",
  CONFERENCE = "conference"
}

export enum StorageTypeEnum {
  GENERAL = "general",
  SECURE = "secure",
  CLIMATE_CONTROLLED = "climate_controlled",
  HAZARDOUS = "hazardous",
  ARCHIVE = "archive"
}

// Helper functions for string conversions
export const statusToString = (status: StatusEnum): string => status;
export const stringToStatus = (str: string): StatusEnum => {
  return Object.values(StatusEnum).includes(str as StatusEnum) 
    ? str as StatusEnum 
    : StatusEnum.ACTIVE;
};

export const roomTypeToString = (type: RoomTypeEnum): string => type;
export const stringToRoomType = (str: string): RoomTypeEnum => {
  return Object.values(RoomTypeEnum).includes(str as RoomTypeEnum)
    ? str as RoomTypeEnum
    : RoomTypeEnum.OFFICE;
};

export const storageTypeToString = (type: StorageTypeEnum): string => type;
export const stringToStorageType = (str: string): StorageTypeEnum => {
  return Object.values(StorageTypeEnum).includes(str as StorageTypeEnum)
    ? str as StorageTypeEnum
    : StorageTypeEnum.GENERAL;
};
