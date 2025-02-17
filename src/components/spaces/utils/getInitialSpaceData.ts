
import { EditSpaceFormData } from "../schemas/editSpaceSchema";
import { RoomType, StorageType } from "../rooms/types/RoomTypes";

type SpaceType = "room" | "door" | "hallway";
type SecurityLevel = "standard" | "restricted" | "high_security";
type DoorType = "standard" | "emergency" | "secure" | "maintenance";
type HallwayType = "public_main" | "private";
type Section = "left_wing" | "right_wing" | "connector";

const VALID_ROOM_TYPES = Object.values(RoomType);
const VALID_STORAGE_TYPES = Object.values(StorageType);

type InitialData = {
  type?: SpaceType;
  name?: string;
  status?: "active" | "inactive" | "under_maintenance";
  floorId?: string;
  description?: string;
  room_number?: string;
  room_type?: RoomType;
  phone_number?: string;
  parent_room_id?: string | null;
  is_storage?: boolean;
  storage_type?: StorageType | null;
  storage_capacity?: number | null;
  storage_notes?: string;
  current_function?: string;
  doorType?: DoorType;
  securityLevel?: SecurityLevel;
  passkeyEnabled?: boolean;
  hallwayType?: HallwayType;
  section?: Section;
  notes?: string;
};

const getDefaultRoomType = (type?: RoomType): RoomType => {
  return (type && VALID_ROOM_TYPES.includes(type)) ? type : RoomType.OFFICE;
};

const getDefaultStorageType = (type?: StorageType | null): StorageType => {
  return (type && VALID_STORAGE_TYPES.includes(type)) ? type : StorageType.GENERAL_STORAGE;
};

const getDefaultDoorType = (type?: DoorType): DoorType => {
  const validTypes: DoorType[] = ["standard", "emergency", "secure", "maintenance"];
  return (type && validTypes.includes(type)) ? type : "standard";
};

const getDefaultSecurityLevel = (level?: SecurityLevel): SecurityLevel => {
  const validLevels: SecurityLevel[] = ["standard", "restricted", "high_security"];
  return (level && validLevels.includes(level)) ? level : "standard";
};

const getDefaultHallwayType = (type?: HallwayType): HallwayType => {
  const validTypes: HallwayType[] = ["public_main", "private"];
  return (type && validTypes.includes(type)) ? type : "public_main";
};

const getDefaultSection = (section?: Section): Section => {
  const validSections: Section[] = ["left_wing", "right_wing", "connector"];
  return (section && validSections.includes(section)) ? section : "left_wing";
};

export const getInitialSpaceData = (
  id: string,
  type: SpaceType,
  initialData?: InitialData
): EditSpaceFormData => {
  const baseValues = {
    id,
    type,
    name: initialData?.name || "",
    status: initialData?.status || "active",
    floorId: initialData?.floorId || "",
  };

  if (type === "room") {
    const roomType = getDefaultRoomType(initialData?.room_type);
    const storageType = getDefaultStorageType(initialData?.storage_type);
    
    return {
      ...baseValues,
      type: "room" as const,
      roomNumber: initialData?.room_number || "",
      roomType,
      phoneNumber: initialData?.phone_number || "",
      description: initialData?.description || "",
      isStorage: initialData?.is_storage ?? false,
      storageCapacity: initialData?.storage_capacity ?? null,
      storageType: initialData?.is_storage ? storageType : null,
      storageNotes: initialData?.storage_notes || "",
      parentRoomId: initialData?.parent_room_id ?? null,
      currentFunction: initialData?.current_function || "",
    };
  }

  if (type === "door") {
    const doorType = getDefaultDoorType(initialData?.doorType);
    const securityLevel = getDefaultSecurityLevel(initialData?.securityLevel);
    
    return {
      ...baseValues,
      type: "door" as const,
      doorType,
      securityLevel,
      passkeyEnabled: initialData?.passkeyEnabled ?? false,
    };
  }

  if (type === "hallway") {
    const hallwayType = getDefaultHallwayType(initialData?.hallwayType);
    const section = getDefaultSection(initialData?.section);
    
    return {
      ...baseValues,
      type: "hallway" as const,
      hallwayType,
      section,
      notes: initialData?.notes || "",
    };
  }

  return baseValues as EditSpaceFormData;
};
