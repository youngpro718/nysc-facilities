
export enum RoomTypeEnum {
  COURTROOM = "courtroom",
  OFFICE = "office",
  CONFERENCE = "conference",
  STORAGE = "storage",
  BATHROOM = "bathroom",
  KITCHEN = "kitchen",
  LOBBY = "lobby",
  HALLWAY = "hallway",
  STAIRWELL = "stairwell",
  ELEVATOR = "elevator",
  UTILITY = "utility",
  MECHANICAL = "mechanical",
  ELECTRICAL = "electrical",
  JANITOR = "janitor",
  SECURITY = "security",
  RECEPTION = "reception",
  WAITING = "waiting",
  LIBRARY = "library",
  ARCHIVE = "archive",
  OTHER = "other"
}

export enum StatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
  MAINTENANCE = "under_maintenance",
  UNDER_CONSTRUCTION = "under_construction",
  RETIRED = "retired"
}

export enum StorageTypeEnum {
  GENERAL = "general",
  SECURE = "secure",
  CLIMATE_CONTROLLED = "climate_controlled",
  HAZARDOUS = "hazardous",
  ARCHIVE = "archive",
  EVIDENCE = "evidence",
  SUPPLY = "supply"
}

export function getRoomTypeDisplayName(type: RoomTypeEnum): string {
  switch (type) {
    case RoomTypeEnum.COURTROOM:
      return "Courtroom";
    case RoomTypeEnum.OFFICE:
      return "Office";
    case RoomTypeEnum.CONFERENCE:
      return "Conference Room";
    case RoomTypeEnum.STORAGE:
      return "Storage";
    case RoomTypeEnum.BATHROOM:
      return "Bathroom";
    case RoomTypeEnum.KITCHEN:
      return "Kitchen";
    case RoomTypeEnum.LOBBY:
      return "Lobby";
    case RoomTypeEnum.HALLWAY:
      return "Hallway";
    case RoomTypeEnum.STAIRWELL:
      return "Stairwell";
    case RoomTypeEnum.ELEVATOR:
      return "Elevator";
    case RoomTypeEnum.UTILITY:
      return "Utility Room";
    case RoomTypeEnum.MECHANICAL:
      return "Mechanical Room";
    case RoomTypeEnum.ELECTRICAL:
      return "Electrical Room";
    case RoomTypeEnum.JANITOR:
      return "Janitor Closet";
    case RoomTypeEnum.SECURITY:
      return "Security Office";
    case RoomTypeEnum.RECEPTION:
      return "Reception";
    case RoomTypeEnum.WAITING:
      return "Waiting Area";
    case RoomTypeEnum.LIBRARY:
      return "Library";
    case RoomTypeEnum.ARCHIVE:
      return "Archive";
    case RoomTypeEnum.OTHER:
      return "Other";
    default:
      return type;
  }
}

export function getStorageTypeDisplayName(type: StorageTypeEnum): string {
  switch (type) {
    case StorageTypeEnum.GENERAL:
      return "General Storage";
    case StorageTypeEnum.SECURE:
      return "Secure Storage";
    case StorageTypeEnum.CLIMATE_CONTROLLED:
      return "Climate Controlled";
    case StorageTypeEnum.HAZARDOUS:
      return "Hazardous Materials";
    case StorageTypeEnum.ARCHIVE:
      return "Archive Storage";
    case StorageTypeEnum.EVIDENCE:
      return "Evidence Storage";
    case StorageTypeEnum.SUPPLY:
      return "Supply Storage";
    default:
      return type;
  }
}
