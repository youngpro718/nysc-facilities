
export enum StatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  UNDER_CONSTRUCTION = 'under_construction'
}

export enum RoomTypeEnum {
  COURTROOM = 'courtroom',
  JUDGES_CHAMBERS = 'judges_chambers',
  JURY_ROOM = 'jury_room',
  CONFERENCE_ROOM = 'conference_room',
  OFFICE = 'office',
  FILING_ROOM = 'filing_room',
  MALE_LOCKER_ROOM = 'male_locker_room',
  FEMALE_LOCKER_ROOM = 'female_locker_room',
  STORAGE = 'storage',
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  HALLWAY = 'hallway',
  LOBBY = 'lobby',
  ELEVATOR = 'elevator',
  STAIRWELL = 'stairwell',
  CONFERENCE = 'conference'
}

export enum StorageTypeEnum {
  GENERAL = 'general',
  RECORDS = 'records',
  EQUIPMENT = 'equipment',
  SUPPLIES = 'supplies',
  ARCHIVE = 'archive'
}

export const statusToString = (status: StatusEnum): string => {
  const statusMap: Record<StatusEnum, string> = {
    [StatusEnum.ACTIVE]: 'Active',
    [StatusEnum.INACTIVE]: 'Inactive',
    [StatusEnum.MAINTENANCE]: 'Maintenance',
    [StatusEnum.UNDER_CONSTRUCTION]: 'Under Construction'
  };
  return statusMap[status] || status;
};

export const roomTypeToString = (type: RoomTypeEnum): string => {
  const typeMap: Record<RoomTypeEnum, string> = {
    [RoomTypeEnum.COURTROOM]: 'Courtroom',
    [RoomTypeEnum.JUDGES_CHAMBERS]: "Judge's Chambers",
    [RoomTypeEnum.JURY_ROOM]: 'Jury Room',
    [RoomTypeEnum.CONFERENCE_ROOM]: 'Conference Room',
    [RoomTypeEnum.OFFICE]: 'Office',
    [RoomTypeEnum.FILING_ROOM]: 'Filing Room',
    [RoomTypeEnum.MALE_LOCKER_ROOM]: 'Male Locker Room',
    [RoomTypeEnum.FEMALE_LOCKER_ROOM]: 'Female Locker Room',
    [RoomTypeEnum.STORAGE]: 'Storage',
    [RoomTypeEnum.KITCHEN]: 'Kitchen',
    [RoomTypeEnum.BATHROOM]: 'Bathroom',
    [RoomTypeEnum.HALLWAY]: 'Hallway',
    [RoomTypeEnum.LOBBY]: 'Lobby',
    [RoomTypeEnum.ELEVATOR]: 'Elevator',
    [RoomTypeEnum.STAIRWELL]: 'Stairwell',
    [RoomTypeEnum.CONFERENCE]: 'Conference'
  };
  return typeMap[type] || type;
};

export const stringToRoomType = (typeString: string): RoomTypeEnum => {
  const normalizedType = typeString.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  const typeMap: Record<string, RoomTypeEnum> = {
    'courtroom': RoomTypeEnum.COURTROOM,
    'judges_chambers': RoomTypeEnum.JUDGES_CHAMBERS,
    'jury_room': RoomTypeEnum.JURY_ROOM,
    'conference_room': RoomTypeEnum.CONFERENCE_ROOM,
    'office': RoomTypeEnum.OFFICE,
    'filing_room': RoomTypeEnum.FILING_ROOM,
    'male_locker_room': RoomTypeEnum.MALE_LOCKER_ROOM,
    'female_locker_room': RoomTypeEnum.FEMALE_LOCKER_ROOM,
    'storage': RoomTypeEnum.STORAGE,
    'kitchen': RoomTypeEnum.KITCHEN,
    'bathroom': RoomTypeEnum.BATHROOM,
    'hallway': RoomTypeEnum.HALLWAY,
    'lobby': RoomTypeEnum.LOBBY,
    'elevator': RoomTypeEnum.ELEVATOR,
    'stairwell': RoomTypeEnum.STAIRWELL,
    'conference': RoomTypeEnum.CONFERENCE
  };
  
  return typeMap[normalizedType] || RoomTypeEnum.OFFICE;
};

export const storageTypeToString = (type: StorageTypeEnum): string => {
  const typeMap: Record<StorageTypeEnum, string> = {
    [StorageTypeEnum.GENERAL]: 'General Storage',
    [StorageTypeEnum.RECORDS]: 'Records Storage',
    [StorageTypeEnum.EQUIPMENT]: 'Equipment Storage',
    [StorageTypeEnum.SUPPLIES]: 'Supplies Storage',
    [StorageTypeEnum.ARCHIVE]: 'Archive Storage'
  };
  return typeMap[type] || type;
};
