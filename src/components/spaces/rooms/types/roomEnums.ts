export enum StatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
  UNDER_MAINTENANCE = "under_maintenance"
}

export enum RoomTypeEnum {
  OFFICE = "office",
  COURTROOM = "courtroom",
  MALE_LOCKER_ROOM = "male_locker_room",
  FEMALE_LOCKER_ROOM = "female_locker_room",
  STORAGE = "storage"
}

export enum StorageTypeEnum {
  GENERAL = "general",
  SECURE = "secure",
  CLIMATE_CONTROLLED = "climate_controlled",
  HAZARDOUS = "hazardous",
  ARCHIVE = "archive"
}

// Update the roomType to directly match what Supabase expects
export type RoomTypeString =
  | "office"
  | "courtroom"
  | "male_locker_room"
  | "female_locker_room"
  | "storage";

export type StatusString = "active" | "inactive" | "under_maintenance";
export type StorageTypeString = "general" | "secure" | "climate_controlled" | "hazardous" | "archive";

// Helper functions for string conversions - ensuring exact strings for database
export const statusToString = (status: StatusEnum): StatusString => {
  switch (status) {
    case StatusEnum.ACTIVE: return "active";
    case StatusEnum.INACTIVE: return "inactive";
    case StatusEnum.UNDER_MAINTENANCE: return "under_maintenance";
    default: return "active"; // Default fallback
  }
};

export const stringToStatus = (str: string): StatusEnum => {
  switch (str) {
    case "active": return StatusEnum.ACTIVE;
    case "inactive": return StatusEnum.INACTIVE;
    case "under_maintenance": return StatusEnum.UNDER_MAINTENANCE;
    default: return StatusEnum.ACTIVE; // Default fallback
  }
};

export const roomTypeToString = (type: RoomTypeEnum): RoomTypeString => {
  switch (type) {
    case RoomTypeEnum.OFFICE: return "office";
    case RoomTypeEnum.COURTROOM: return "courtroom";
    case RoomTypeEnum.MALE_LOCKER_ROOM: return "male_locker_room";
    case RoomTypeEnum.FEMALE_LOCKER_ROOM: return "female_locker_room";
    case RoomTypeEnum.STORAGE: return "storage";
    default: return "office";
  }
};

export const stringToRoomType = (str: string): RoomTypeEnum => {
  switch (str) {
    case "office": return RoomTypeEnum.OFFICE;
    case "courtroom": return RoomTypeEnum.COURTROOM;
    case "male_locker_room": return RoomTypeEnum.MALE_LOCKER_ROOM;
    case "female_locker_room": return RoomTypeEnum.FEMALE_LOCKER_ROOM;
    case "storage": return RoomTypeEnum.STORAGE;
    default: return RoomTypeEnum.OFFICE;
  }
};

export const storageTypeToString = (type: StorageTypeEnum): StorageTypeString => {
  // Explicit mapping for storage types
  switch (type) {
    case StorageTypeEnum.GENERAL: return "general";
    case StorageTypeEnum.SECURE: return "secure";
    case StorageTypeEnum.CLIMATE_CONTROLLED: return "climate_controlled";
    case StorageTypeEnum.HAZARDOUS: return "hazardous";
    case StorageTypeEnum.ARCHIVE: return "archive";
    default: return "general"; // Default fallback
  }
};

export const stringToStorageType = (str: string): StorageTypeEnum => {
  // Explicit mapping for reverse conversion
  switch (str) {
    case "general": return StorageTypeEnum.GENERAL;
    case "secure": return StorageTypeEnum.SECURE;
    case "climate_controlled": return StorageTypeEnum.CLIMATE_CONTROLLED;
    case "hazardous": return StorageTypeEnum.HAZARDOUS;
    case "archive": return StorageTypeEnum.ARCHIVE;
    default: return StorageTypeEnum.GENERAL; // Default fallback
  }
};
