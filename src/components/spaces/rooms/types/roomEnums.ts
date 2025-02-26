
export enum RoomTypeEnum {
  COURTROOM = "courtroom",
  JUDGES_CHAMBERS = "judges_chambers",
  JURY_ROOM = "jury_room",
  CONFERENCE_ROOM = "conference_room",
  OFFICE = "office",
  FILING_ROOM = "filing_room",
  MALE_LOCKER_ROOM = "male_locker_room",
  FEMALE_LOCKER_ROOM = "female_locker_room",
  ROBING_ROOM = "robing_room",
  STAKE_HOLDER = "stake_holder",
  RECORDS_ROOM = "records_room",
  ADMINISTRATIVE_OFFICE = "administrative_office",
  BREAK_ROOM = "break_room",
  IT_ROOM = "it_room",
  UTILITY_ROOM = "utility_room"
}

export enum StorageTypeEnum {
  FILE_STORAGE = "file_storage",
  EQUIPMENT_STORAGE = "equipment_storage",
  SUPPLY_STORAGE = "supply_storage",
  EVIDENCE_STORAGE = "evidence_storage",
  RECORD_STORAGE = "record_storage",
  GENERAL_STORAGE = "general_storage"
}

export enum StatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
  UNDER_MAINTENANCE = "under_maintenance"
}

export interface LightingFixture {
  id: string;
  type: string;
  status: string;
  technology: string;
  electrical_issues: boolean;
  ballast_issue: boolean;
  maintenance_notes?: string;
}
