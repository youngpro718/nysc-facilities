
import { z } from "zod";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

// Define connection schema
const connectionSchema = z.object({
  toSpaceId: z.string().optional(),
  connectionType: z.string().optional(),
  direction: z.string().optional()
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
  date: z.string(), // Changed from z.date() to z.string()
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

// Base schema for all space types
const baseSpaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  buildingId: z.string().min(1, "Building is required"),
  floorId: z.string().min(1, "Floor is required"),
  status: z.nativeEnum(StatusEnum),
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
  connections: connectionSchema.optional()
});

// Room-specific schema
const roomSchema = baseSpaceSchema.extend({
  type: z.literal("room"),
  roomType: z.nativeEnum(RoomTypeEnum),
  roomNumber: z.string().optional(),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().optional(),
  phoneNumber: z.string().optional(),
  storageType: z.nativeEnum(StorageTypeEnum).nullable(),
  storageCapacity: z.number().nullable(), // This must be a number
  storageNotes: z.string().optional(),
  parentRoomId: z.string().nullable()
});

// Hallway-specific schema - enhanced with more specific hallway fields
const hallwaySchema = baseSpaceSchema.extend({
  type: z.literal("hallway"),
  hallwayType: z.enum(["public_main", "private"]).optional(),
  section: z.enum(["left_wing", "right_wing", "connector"]).optional(),
  maintenanceSchedule: z.array(maintenanceScheduleEntrySchema).optional(),
  emergencyExits: z.array(emergencyExitSchema).optional(),
  maintenancePriority: z.string().optional(),
  maintenanceNotes: z.string().optional(),
  emergencyRoute: z.enum(["primary", "secondary", "not_designated"]).optional(),
  accessibility: z.enum(["fully_accessible", "limited_access", "stairs_only", "restricted"]).optional(),
  trafficFlow: z.enum(["one_way", "two_way", "restricted"]).optional(),
  capacityLimit: z.number().optional(),
  width: z.number().optional(),
  length: z.number().optional()
});

// Door-specific schema
const doorSchema = baseSpaceSchema.extend({
  type: z.literal("door"),
  doorType: z.string().optional(),
  securityLevel: z.string().optional(),
  passkeyEnabled: z.boolean().optional(),
  closerStatus: z.string().optional(),
  windPressureIssues: z.boolean().optional(),
  hardwareStatus: hardwareStatusSchema.optional(),
  nextMaintenanceDate: z.string().optional(), // Changed from z.date() to z.string()
  maintenanceNotes: z.string().optional(),
  statusHistory: z.array(z.any()).optional()
});

export const createSpaceSchema = z.discriminatedUnion("type", [
  roomSchema,
  hallwaySchema,
  doorSchema
]);

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;
