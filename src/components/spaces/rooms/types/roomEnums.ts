
export enum StatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  UNDER_MAINTENANCE = 'under_maintenance',
  CLOSED = 'closed'
}

export enum RoomTypeEnum {
  COURTROOM = 'courtroom',
  MALE_LOCKER_ROOM = 'male_locker_room',
  FEMALE_LOCKER_ROOM = 'female_locker_room',
  OFFICE = 'office',
  STORAGE = 'storage'
}

export enum StorageTypeEnum {
  GENERAL = 'general',
  SUPPLIES = 'supplies',
  EQUIPMENT = 'equipment',
  DOCUMENTS = 'documents',
  EVIDENCE = 'evidence'
}

export function statusToString(status: StatusEnum): string {
  switch (status) {
    case StatusEnum.ACTIVE:
      return 'Active';
    case StatusEnum.INACTIVE:
      return 'Inactive';
    case StatusEnum.MAINTENANCE:
    case StatusEnum.UNDER_MAINTENANCE:
      return 'Maintenance';
    case StatusEnum.CLOSED:
      return 'Closed';
    default:
      return 'Unknown';
  }
}

export function roomTypeToString(roomType: RoomTypeEnum): string {
  switch (roomType) {
    case RoomTypeEnum.COURTROOM:
      return 'Courtroom';
    case RoomTypeEnum.MALE_LOCKER_ROOM:
      return 'Male Locker Room';
    case RoomTypeEnum.FEMALE_LOCKER_ROOM:
      return 'Female Locker Room';
    case RoomTypeEnum.OFFICE:
      return 'Office';
    case RoomTypeEnum.STORAGE:
      return 'Storage';
    default:
      return 'Unknown';
  }
}

export function storageTypeToString(type: StorageTypeEnum): string {
  switch (type) {
    case StorageTypeEnum.GENERAL:
      return 'General';
    case StorageTypeEnum.SUPPLIES:
      return 'Supplies';
    case StorageTypeEnum.EQUIPMENT:
      return 'Equipment';
    case StorageTypeEnum.DOCUMENTS:
      return 'Documents';
    case StorageTypeEnum.EVIDENCE:
      return 'Evidence';
    default:
      return 'Unknown';
  }
}

export function stringToStatus(status: string): StatusEnum {
  switch (status.toLowerCase()) {
    case 'active':
      return StatusEnum.ACTIVE;
    case 'inactive':
      return StatusEnum.INACTIVE;
    case 'maintenance':
    case 'under_maintenance':
      return StatusEnum.UNDER_MAINTENANCE;
    case 'closed':
      return StatusEnum.CLOSED;
    default:
      return StatusEnum.ACTIVE;
  }
}

export function stringToRoomType(type: string): RoomTypeEnum {
  switch (type.toLowerCase()) {
    case 'courtroom':
      return RoomTypeEnum.COURTROOM;
    case 'male_locker_room':
      return RoomTypeEnum.MALE_LOCKER_ROOM;
    case 'female_locker_room':
      return RoomTypeEnum.FEMALE_LOCKER_ROOM;
    case 'office':
      return RoomTypeEnum.OFFICE;
    case 'storage':
      return RoomTypeEnum.STORAGE;
    default:
      return RoomTypeEnum.OFFICE;
  }
}

export function stringToStorageType(type: string): StorageTypeEnum {
  switch (type.toLowerCase()) {
    case 'general':
      return StorageTypeEnum.GENERAL;
    case 'supplies':
      return StorageTypeEnum.SUPPLIES;
    case 'equipment':
      return StorageTypeEnum.EQUIPMENT;
    case 'documents':
      return StorageTypeEnum.DOCUMENTS;
    case 'evidence':
      return StorageTypeEnum.EVIDENCE;
    default:
      return StorageTypeEnum.GENERAL;
  }
}
