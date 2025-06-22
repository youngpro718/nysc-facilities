
export enum StatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed'
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
      return 'Maintenance';
    case StatusEnum.CLOSED:
      return 'Closed';
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
      return StatusEnum.MAINTENANCE;
    case 'closed':
      return StatusEnum.CLOSED;
    default:
      return StatusEnum.ACTIVE;
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
