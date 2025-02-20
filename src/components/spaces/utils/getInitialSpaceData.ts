
import { EditSpaceFormData } from "../schemas/editSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../rooms/types/roomEnums";

type SpaceType = "room" | "door" | "hallway";
type SecurityLevel = "standard" | "restricted" | "high_security";
type DoorType = "standard" | "emergency" | "secure" | "maintenance";
type HallwayType = "public_main" | "private";
type Section = "left_wing" | "right_wing" | "connector";

const VALID_ROOM_TYPES = Object.values(RoomTypeEnum);
const VALID_STORAGE_TYPES = Object.values(StorageTypeEnum);

type InitialData = {
  type?: SpaceType;
  name?: string;
  status?: StatusEnum;
  floorId?: string;
  description?: string;
  room_number?: string;
  room_type?: RoomTypeEnum;
  phone_number?: string;
  parent_room_id?: string | null;
  is_storage?: boolean;
  storage_type?: StorageTypeEnum | null;
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

const getDefaultRoomType = (type?: RoomTypeEnum): RoomTypeEnum => {
  return (type && VALID_ROOM_TYPES.includes(type)) ? type : RoomTypeEnum.OFFICE;
};

const getDefaultStorageType = (type?: StorageTypeEnum | null): StorageTypeEnum => {
  return (type && VALID_STORAGE_TYPES.includes(type)) ? type : StorageTypeEnum.GENERAL_STORAGE;
};

// New helper function to convert numeric capacity to string enum
const getStorageCapacity = (capacity?: number | null): "small" | "medium" | "large" | null => {
  if (capacity === null || capacity === undefined) return null;
  if (capacity <= 100) return "small";
  if (capacity <= 200) return "medium";
  return "large";
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
    status: initialData?.status || StatusEnum.ACTIVE,
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
      storageCapacity: getStorageCapacity(initialData?.storage_capacity),
      storageType: initialData?.is_storage ? storageType : null,
      storageNotes: initialData?.storage_notes || "",
      parentRoomId: initialData?.parent_room_id ?? null,
      currentFunction: initialData?.current_function || "",
      position: { x: 0, y: 0 },
      size: { width: 150, height: 100 },
      rotation: 0
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
      hardwareStatus: {
        hinges: "functional",
        doorknob: "functional",
        lock: "functional",
        frame: "functional"
      },
      componentIssues: {
        closer: [],
        hinges: [],
        doorknob: [],
        lock: [],
        frame: []
      }
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
      traffic_flow: "two_way",
      accessibility: "fully_accessible",
      emergency_route: "not_designated",
      security_level: "standard",
      emergency_exits: [],
      maintenance_schedule: []
    };
  }

  return baseValues as EditSpaceFormData;
};
