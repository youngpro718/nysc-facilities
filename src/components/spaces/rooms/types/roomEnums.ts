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
  MEETING = "conference", // This maps to "conference" in the database
  RECORDS_ROOM = "records_room", // Added to match database enum
  ADMINISTRATIVE_OFFICE = "administrative_office", // Added to match database enum
  BREAK_ROOM = "break_room", // Added to match database enum
  IT_ROOM = "it_room", // Added to match database enum
  UTILITY_ROOM = "utility_room", // Added to match database enum
  STORAGE = "utility_room", // Changed from "storage" to "utility_room" since storage isn't in the database enum
  CHAMBERS = "judges_chambers", // Map to existing enum value
  RECEPTION = "office", // Map to existing enum value
  BREAKROOM = "break_room", // Map to existing enum value
  LIBRARY = "filing_room", // Map to existing enum value
  UTILITY = "utility_room", // Map to existing enum value
  SPECIAL = "office", // Map to existing enum value
  LABORATORY = "laboratory" // Added laboratory type based on error message
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
  | "judges_chambers"
  | "jury_room"
  | "conference_room"
  | "filing_room"
  | "male_locker_room"
  | "female_locker_room"
  | "robing_room"
  | "stake_holder"
  | "conference"
  | "records_room"
  | "administrative_office"
  | "break_room"
  | "it_room"
  | "utility_room"
  | "laboratory";

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
  // Explicit mapping to ensure correct conversion
  switch (type) {
    case RoomTypeEnum.OFFICE: return "office";
    case RoomTypeEnum.COURTROOM: return "courtroom";
    case RoomTypeEnum.JUDGES_CHAMBERS: return "judges_chambers";
    case RoomTypeEnum.JURY_ROOM: return "jury_room";
    case RoomTypeEnum.CONFERENCE_ROOM: return "conference_room";
    case RoomTypeEnum.FILING_ROOM: return "filing_room";
    case RoomTypeEnum.MALE_LOCKER_ROOM: return "male_locker_room";
    case RoomTypeEnum.FEMALE_LOCKER_ROOM: return "female_locker_room";
    case RoomTypeEnum.ROBING_ROOM: return "robing_room";
    case RoomTypeEnum.STAKE_HOLDER: return "stake_holder";
    case RoomTypeEnum.MEETING: return "conference";
    case RoomTypeEnum.RECORDS_ROOM: return "records_room";
    case RoomTypeEnum.ADMINISTRATIVE_OFFICE: return "administrative_office";
    case RoomTypeEnum.BREAK_ROOM: return "break_room";
    case RoomTypeEnum.IT_ROOM: return "it_room";
    case RoomTypeEnum.UTILITY_ROOM: return "utility_room";
    case RoomTypeEnum.STORAGE: return "utility_room"; // Map to utility_room
    case RoomTypeEnum.CHAMBERS: return "judges_chambers";
    case RoomTypeEnum.RECEPTION: return "office";
    case RoomTypeEnum.BREAKROOM: return "break_room";
    case RoomTypeEnum.LIBRARY: return "filing_room";
    case RoomTypeEnum.UTILITY: return "utility_room";
    case RoomTypeEnum.SPECIAL: return "office";
    case RoomTypeEnum.LABORATORY: return "laboratory";
    default: return "office"; // Default fallback
  }
};

export const stringToRoomType = (str: string): RoomTypeEnum => {
  // Explicit mapping for reverse conversion
  switch (str) {
    case "office": return RoomTypeEnum.OFFICE;
    case "courtroom": return RoomTypeEnum.COURTROOM;
    case "judges_chambers": return RoomTypeEnum.JUDGES_CHAMBERS;
    case "jury_room": return RoomTypeEnum.JURY_ROOM;
    case "conference_room": return RoomTypeEnum.CONFERENCE_ROOM;
    case "filing_room": return RoomTypeEnum.FILING_ROOM;
    case "male_locker_room": return RoomTypeEnum.MALE_LOCKER_ROOM;
    case "female_locker_room": return RoomTypeEnum.FEMALE_LOCKER_ROOM;
    case "robing_room": return RoomTypeEnum.ROBING_ROOM;
    case "stake_holder": return RoomTypeEnum.STAKE_HOLDER;
    case "conference": return RoomTypeEnum.MEETING;
    case "records_room": return RoomTypeEnum.RECORDS_ROOM;
    case "administrative_office": return RoomTypeEnum.ADMINISTRATIVE_OFFICE;
    case "break_room": return RoomTypeEnum.BREAK_ROOM;
    case "it_room": return RoomTypeEnum.IT_ROOM;
    case "utility_room": return RoomTypeEnum.UTILITY_ROOM;
    case "laboratory": return RoomTypeEnum.LABORATORY;
    default: return RoomTypeEnum.OFFICE; // Default fallback
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
