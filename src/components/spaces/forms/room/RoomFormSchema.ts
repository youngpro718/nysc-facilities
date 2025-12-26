
import { z } from "zod";
import { 
  RoomTypeEnum, 
  StatusEnum, 
  StorageTypeEnum, 
  SimplifiedStorageTypeEnum,
  CapacitySizeCategoryEnum 
} from "../../rooms/types/roomEnums";

export const ConnectionDirections = [
  "north",
  "south",
  "east",
  "west",
  "northeast",
  "northwest",
  "southeast",
  "southwest",
] as const;

// Define the schema for room connections
export const RoomConnectionSchema = z.object({
  toSpaceId: z.string().min(1, "Connected space is required"),
  connectionType: z.string().min(1, "Connection type is required"),
  direction: z.enum(ConnectionDirections).optional(),
  id: z.string().uuid().optional(), // Add id field for existing connections
});

// Define the room access schema for internal access items
export const RoomAccessSchema = z.object({
  id: z.string().uuid().optional(), // For existing access items
  accessType: z.enum(['room_entry', 'office_door', 'locker', 'cabinet', 'storage', 'key_box']),
  keyId: z.string().optional(), // Optional - can be empty if no key assigned
  keyName: z.string().optional(),
  description: z.string().optional(),
  locationWithinRoom: z.string().optional(),
});

// Get all enum values for RoomTypeEnum to use in the schema
const roomTypeValues = [
  RoomTypeEnum.OFFICE,
  RoomTypeEnum.COURTROOM,
  RoomTypeEnum.CHAMBER,
  RoomTypeEnum.JUDGES_CHAMBERS,
  RoomTypeEnum.JURY_ROOM,
  RoomTypeEnum.CONFERENCE_ROOM,
  RoomTypeEnum.FILING_ROOM,
  RoomTypeEnum.MALE_LOCKER_ROOM,
  RoomTypeEnum.FEMALE_LOCKER_ROOM,
  RoomTypeEnum.ROBING_ROOM,
  RoomTypeEnum.STAKE_HOLDER,
  RoomTypeEnum.RECORDS_ROOM,
  RoomTypeEnum.ADMINISTRATIVE_OFFICE,
  RoomTypeEnum.BREAK_ROOM,
  RoomTypeEnum.IT_ROOM,
  RoomTypeEnum.UTILITY_ROOM,
  RoomTypeEnum.LABORATORY,
  RoomTypeEnum.CONFERENCE
];

// Define the room form schema with all fields
export const RoomFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  floorId: z.string().min(1, "Floor is required"),
  roomNumber: z.string().optional(),
  roomType: z.enum(roomTypeValues as [RoomTypeEnum, ...RoomTypeEnum[]]),
  status: z.enum([
    StatusEnum.ACTIVE,
    StatusEnum.INACTIVE,
    StatusEnum.UNDER_MAINTENANCE,
  ]),
  description: z.string().optional(),
  phoneNumber: z.string().optional(),
  // Capacity Management Fields
  capacity: z.number().min(1, "Capacity must be at least 1").optional(),
  maxOccupancy: z.number().min(1, "Max occupancy must be at least 1").optional(),
  // Courtroom Specific Capacity Fields
  jurorCapacity: z.number().min(1, "Juror capacity must be at least 1").optional(),
  spectatorCapacity: z.number().min(1, "Spectator capacity must be at least 1").optional(),
  // Accessibility Capacity
  wheelchairAccessibleSpaces: z.number().min(0, "Cannot be negative").optional(),
  hearingAssistedSpaces: z.number().min(0, "Cannot be negative").optional(),
  isStorage: z.boolean().default(false),
  // Make storage fields properly optional
  // Legacy storage type (keeping for backward compatibility)
  storageType: z.enum([
    StorageTypeEnum.GENERAL,
    StorageTypeEnum.SECURE,
    StorageTypeEnum.CLIMATE_CONTROLLED,
    StorageTypeEnum.HAZARDOUS,
    StorageTypeEnum.ARCHIVE,
  ]).nullable().optional(),
  // New simplified storage type
  simplifiedStorageType: z.enum([
    SimplifiedStorageTypeEnum.FILES,
    SimplifiedStorageTypeEnum.SUPPLIES,
    SimplifiedStorageTypeEnum.FURNITURE,
    SimplifiedStorageTypeEnum.EQUIPMENT,
    SimplifiedStorageTypeEnum.GENERAL,
  ]).nullable().optional(),
  // User-friendly capacity size category
  capacitySizeCategory: z.enum([
    CapacitySizeCategoryEnum.SMALL,
    CapacitySizeCategoryEnum.MEDIUM,
    CapacitySizeCategoryEnum.LARGE,
    CapacitySizeCategoryEnum.EXTRA_LARGE,
  ]).nullable().optional(),
  storageCapacity: z.number().nullable().optional(),
  storageNotes: z.string().nullable().optional(),
  // Original room type tracking for temporary storage
  originalRoomType: z.string().nullable().optional(),
  temporaryStorageUse: z.boolean().default(false),
  // Make parentRoomId properly optional
  parentRoomId: z.string().nullable().optional(),
  connections: z.array(RoomConnectionSchema).optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  size: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  rotation: z.number().optional(),
  type: z.literal("room").default("room"),
  courtroom_photos: z.object({
    judge_view: z.array(z.string()).nullable().optional(),
    audience_view: z.array(z.string()).nullable().optional()
  }).nullable().optional(),
  // Replace keyDoorConnections with new room access system
  roomAccess: z.array(RoomAccessSchema).optional(),
  passkeyEnabled: z.boolean().default(false),
  // Progressive data collection fields
  currentFunction: z.string().nullable().optional(),
  temporaryUseTimeline: z.object({
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    reason: z.string().nullable().optional(),
  }).nullable().optional(),
  generalPhotos: z.array(z.object({
    url: z.string(),
    caption: z.string().nullable().optional(),
    uploadedAt: z.string().nullable().optional(),
  })).nullable().optional(),
  lastInspectionDate: z.string().nullable().optional(),
  nextMaintenanceDate: z.string().nullable().optional(),
  technologyInstalled: z.array(z.string()).nullable().optional(),
  securityLevel: z.string().nullable().optional(),
  environmentalControls: z.string().nullable().optional(),
  // Lighting fields
  ceilingHeight: z.enum(['standard', 'high', 'double_height']).nullable().optional(),
  expectedFixtureCount: z.number().min(0).nullable().optional(),
  primaryBulbType: z.enum(['LED', 'Fluorescent', 'Mixed']).nullable().optional(),
  lightingNotes: z.string().nullable().optional(),
});

// Export types derived from the schema
export type RoomFormData = z.infer<typeof RoomFormSchema>;
export type RoomConnectionData = z.infer<typeof RoomConnectionSchema>;
export type RoomAccessData = z.infer<typeof RoomAccessSchema>;
