
import { z } from "zod";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../rooms/types/roomEnums";
import { 
  HallwaySection,
  HallwayType,
  TrafficFlow,
  Accessibility,
  EmergencyRoute
} from "../types/hallwayTypes";

// Define connection schema - simplified
const connectionSchema = z.object({
  toSpaceId: z.string().uuid().optional(),
  connectionType: z.enum(["door", "direct", "hallway"]).optional(),
  direction: z.string().optional().default("adjacent")
});

// Define hardware status schema
const hardwareStatusSchema = z.object({
  frame: z.string(),
  hinges: z.string(),
  doorknob: z.string(),
  lock: z.string()
});

// Define maintenance schedule entry schema
const maintenanceScheduleEntrySchema = z.object({
  date: z.string(),
  type: z.string(),
  status: z.string(),
  assignedTo: z.string().optional()
});

// Define emergency exit schema
const emergencyExitSchema = z.object({
  location: z.string(),
  type: z.string(),
  notes: z.string().optional()
});

// Define courtroom photos schema
const courtRoomPhotosSchema = z.object({
  judge_view: z.string().nullable().optional(),
  audience_view: z.string().nullable().optional()
}).nullable().optional();

// Base schema for all space types - removed redundant status field
const baseSpaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  buildingId: z.string().min(1, "Building is required"),
  floorId: z.string().min(1, "Floor is required"),
  description: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  size: z.object({
    width: z.number(),
    height: z.number()
  }).optional(),
  rotation: z.number().optional(),
  connections: z.array(connectionSchema).default([])
});

// Room-specific schema with improved parent room support
const roomSchema = baseSpaceSchema.extend({
  type: z.literal("room"),
  roomType: z.nativeEnum(RoomTypeEnum),
  roomNumber: z.string().optional(),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().optional(),
  phoneNumber: z.string().optional(),
  storageType: z.nativeEnum(StorageTypeEnum).nullable(),
  storageCapacity: z.number().nullable(),
  storageNotes: z.string().optional(),
  parentRoomId: z.string().nullable(), // Improved parent room support
  courtRoomPhotos: courtRoomPhotosSchema,
  status: z.nativeEnum(StatusEnum).default(StatusEnum.ACTIVE) // Keep status but with default
});

// Hallway-specific schema - simplified
const hallwaySchema = baseSpaceSchema.extend({
  type: z.literal("hallway"),
  hallwayType: z.enum(["public_main", "private"]).optional(),
  section: z.enum(["left_wing", "right_wing", "connector"]).optional(),
  maintenanceSchedule: z.array(maintenanceScheduleEntrySchema).optional(),
  emergencyExits: z.array(emergencyExitSchema).optional(),
  maintenancePriority: z.enum(["low", "medium", "high"]).optional(),
  maintenanceNotes: z.string().optional(),
  emergencyRoute: z.enum(["primary", "secondary", "not_designated"]).optional(),
  accessibility: z.enum(["fully_accessible", "limited_access", "stairs_only", "restricted"]).optional(),
  trafficFlow: z.enum(["one_way", "two_way", "restricted"]).optional(),
  capacityLimit: z.number().optional(),
  width: z.number().optional(),
  length: z.number().optional(),
  status: z.nativeEnum(StatusEnum).default(StatusEnum.ACTIVE)
});

// Door-specific schema - simplified
const doorSchema = baseSpaceSchema.extend({
  type: z.literal("door"),
  doorType: z.string().optional(),
  securityLevel: z.string().optional(),
  passkeyEnabled: z.boolean().optional(),
  closerStatus: z.string().optional(),
  windPressureIssues: z.boolean().optional(),
  hardwareStatus: hardwareStatusSchema.optional(),
  nextMaintenanceDate: z.string().optional(),
  maintenanceNotes: z.string().optional(),
  statusHistory: z.array(z.any()).optional(),
  status: z.nativeEnum(StatusEnum).default(StatusEnum.ACTIVE)
});

export const createSpaceSchema = z.discriminatedUnion("type", [
  roomSchema,
  hallwaySchema,
  doorSchema
]);

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;
