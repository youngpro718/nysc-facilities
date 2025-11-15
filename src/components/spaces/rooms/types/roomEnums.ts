
export enum StatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
  UNDER_MAINTENANCE = "under_maintenance"
}

export enum RoomTypeEnum {
  OFFICE = "office",
  COURTROOM = "courtroom",
  CHAMBER = "chamber",
  JUDGES_CHAMBERS = "judges_chambers",
  JURY_ROOM = "jury_room",
  CONFERENCE_ROOM = "conference_room",
  FILING_ROOM = "filing_room",
  MALE_LOCKER_ROOM = "male_locker_room",
  FEMALE_LOCKER_ROOM = "female_locker_room",
  ROBING_ROOM = "robing_room",
  STAKE_HOLDER = "stake_holder",
  RECORDS_ROOM = "records_room",
  ADMINISTRATIVE_OFFICE = "administrative_office",
  BREAK_ROOM = "break_room",
  IT_ROOM = "it_room",
  UTILITY_ROOM = "utility_room",
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

// New simplified storage types
export enum SimplifiedStorageTypeEnum {
  FILES = "files",
  SUPPLIES = "supplies",
  FURNITURE = "furniture", 
  EQUIPMENT = "equipment",
  GENERAL = "general"
}

// Capacity size categories for user-friendly input
export enum CapacitySizeCategoryEnum {
  SMALL = "small",
  MEDIUM = "medium", 
  LARGE = "large",
  EXTRA_LARGE = "extra_large"
}

// Update the roomType to directly match what Supabase expects
export type RoomTypeString =
  | "office"
  | "courtroom"
  | "chamber"
  | "judges_chambers"
  | "jury_room"
  | "conference_room"
  | "filing_room"
  | "male_locker_room"
  | "female_locker_room"
  | "robing_room"
  | "stake_holder"
  | "records_room"
  | "administrative_office"
  | "break_room"
  | "it_room"
  | "utility_room"
  | "laboratory"
  | "conference";

export type StatusString = "active" | "inactive" | "under_maintenance";
export type StorageTypeString = "general" | "secure" | "climate_controlled" | "hazardous" | "archive";
export type SimplifiedStorageTypeString = "files" | "supplies" | "furniture" | "equipment" | "general";
export type CapacitySizeCategoryString = "small" | "medium" | "large" | "extra_large";

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
    case RoomTypeEnum.CHAMBER: return "chamber";
    case RoomTypeEnum.JUDGES_CHAMBERS: return "judges_chambers";
    case RoomTypeEnum.JURY_ROOM: return "jury_room";
    case RoomTypeEnum.CONFERENCE_ROOM: return "conference_room";
    case RoomTypeEnum.FILING_ROOM: return "filing_room";
    case RoomTypeEnum.MALE_LOCKER_ROOM: return "male_locker_room";
    case RoomTypeEnum.FEMALE_LOCKER_ROOM: return "female_locker_room";
    case RoomTypeEnum.ROBING_ROOM: return "robing_room";
    case RoomTypeEnum.STAKE_HOLDER: return "stake_holder";
    case RoomTypeEnum.RECORDS_ROOM: return "records_room";
    case RoomTypeEnum.ADMINISTRATIVE_OFFICE: return "administrative_office";
    case RoomTypeEnum.BREAK_ROOM: return "break_room";
    case RoomTypeEnum.IT_ROOM: return "it_room";
    case RoomTypeEnum.UTILITY_ROOM: return "utility_room";
    case RoomTypeEnum.LABORATORY: return "laboratory";
    case RoomTypeEnum.CONFERENCE: return "conference";
    default: return "office";
  }
};

export const stringToRoomType = (str: string): RoomTypeEnum => {
  switch (str) {
    case "office": return RoomTypeEnum.OFFICE;
    case "courtroom": return RoomTypeEnum.COURTROOM;
    case "chamber": return RoomTypeEnum.CHAMBER;
    case "judges_chambers": return RoomTypeEnum.JUDGES_CHAMBERS;
    case "jury_room": return RoomTypeEnum.JURY_ROOM;
    case "conference_room": return RoomTypeEnum.CONFERENCE_ROOM;
    case "filing_room": return RoomTypeEnum.FILING_ROOM;
    case "male_locker_room": return RoomTypeEnum.MALE_LOCKER_ROOM;
    case "female_locker_room": return RoomTypeEnum.FEMALE_LOCKER_ROOM;
    case "robing_room": return RoomTypeEnum.ROBING_ROOM;
    case "stake_holder": return RoomTypeEnum.STAKE_HOLDER;
    case "records_room": return RoomTypeEnum.RECORDS_ROOM;
    case "administrative_office": return RoomTypeEnum.ADMINISTRATIVE_OFFICE;
    case "break_room": return RoomTypeEnum.BREAK_ROOM;
    case "it_room": return RoomTypeEnum.IT_ROOM;
    case "utility_room": return RoomTypeEnum.UTILITY_ROOM;
    case "laboratory": return RoomTypeEnum.LABORATORY;
    case "conference": return RoomTypeEnum.CONFERENCE;
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

// Helper functions for simplified storage types
export const simplifiedStorageTypeToString = (type: SimplifiedStorageTypeEnum): SimplifiedStorageTypeString => {
  switch (type) {
    case SimplifiedStorageTypeEnum.FILES: return "files";
    case SimplifiedStorageTypeEnum.SUPPLIES: return "supplies";
    case SimplifiedStorageTypeEnum.FURNITURE: return "furniture";
    case SimplifiedStorageTypeEnum.EQUIPMENT: return "equipment";
    case SimplifiedStorageTypeEnum.GENERAL: return "general";
    default: return "general";
  }
};

export const stringToSimplifiedStorageType = (str: string): SimplifiedStorageTypeEnum => {
  switch (str) {
    case "files": return SimplifiedStorageTypeEnum.FILES;
    case "supplies": return SimplifiedStorageTypeEnum.SUPPLIES;
    case "furniture": return SimplifiedStorageTypeEnum.FURNITURE;
    case "equipment": return SimplifiedStorageTypeEnum.EQUIPMENT;
    case "general": return SimplifiedStorageTypeEnum.GENERAL;
    default: return SimplifiedStorageTypeEnum.GENERAL;
  }
};

// Helper functions for capacity size categories
export const capacitySizeCategoryToString = (category: CapacitySizeCategoryEnum): CapacitySizeCategoryString => {
  switch (category) {
    case CapacitySizeCategoryEnum.SMALL: return "small";
    case CapacitySizeCategoryEnum.MEDIUM: return "medium";
    case CapacitySizeCategoryEnum.LARGE: return "large";
    case CapacitySizeCategoryEnum.EXTRA_LARGE: return "extra_large";
    default: return "medium";
  }
};

export const stringToCapacitySizeCategory = (str: string): CapacitySizeCategoryEnum => {
  switch (str) {
    case "small": return CapacitySizeCategoryEnum.SMALL;
    case "medium": return CapacitySizeCategoryEnum.MEDIUM;
    case "large": return CapacitySizeCategoryEnum.LARGE;
    case "extra_large": return CapacitySizeCategoryEnum.EXTRA_LARGE;
    default: return CapacitySizeCategoryEnum.MEDIUM;
  }
};

// Helper function to convert capacity size to cubic feet
export const capacitySizeToCubicFeet = (category: CapacitySizeCategoryString): number => {
  switch (category) {
    case "small": return 50; // Small closet/cabinet
    case "medium": return 300; // Standard office room
    case "large": return 1000; // Large storage room
    case "extra_large": return 2000; // Warehouse space
    default: return 300;
  }
};

// Helper function to get capacity description
export const getCapacitySizeDescription = (category: CapacitySizeCategoryString): string => {
  switch (category) {
    case "small": return "Small closet/cabinet (< 100 cubic feet)";
    case "medium": return "Standard office room (100-500 cubic feet)";
    case "large": return "Large storage room (500-1500 cubic feet)";
    case "extra_large": return "Warehouse space (1500+ cubic feet)";
    default: return "Standard office room (100-500 cubic feet)";
  }
};

// Helper function to get simplified storage type description
export const getSimplifiedStorageTypeDescription = (type: SimplifiedStorageTypeString): string => {
  switch (type) {
    case "files": return "Documents, records, case files";
    case "supplies": return "Office supplies, general supplies";
    case "furniture": return "Chairs, desks, storage furniture";
    case "equipment": return "IT equipment, specialized equipment";
    case "general": return "Mixed or unspecified storage";
    default: return "Mixed or unspecified storage";
  }
};
