
import { z } from "zod";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

// Define common enums
export const StorageCapacityEnum = z.enum(["small", "medium", "large"]);
export type StorageCapacityType = z.infer<typeof StorageCapacityEnum>;

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
  date: z.date(),
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

// Base schema
const baseSpaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["room", "hallway", "door"]),
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

// Door-specific schema
const doorSchema = z.object({
  doorType: z.string().optional(),
  securityLevel: z.string().optional(),
  passkeyEnabled: z.boolean().optional(),
  closerStatus: z.string().optional(),
  windPressureIssues: z.boolean().optional(),
  hardwareStatus: hardwareStatusSchema.optional(),
  nextMaintenanceDate: z.date().optional(),
  maintenanceNotes: z.string().optional(),
});

// Hallway-specific schema
const hallwaySchema = z.object({
  hallwayType: z.string().optional(),
  section: z.string().optional(),
  maintenanceSchedule: z.array(maintenanceScheduleEntrySchema).optional(),
  emergencyExits: z.array(emergencyExitSchema).optional(),
  maintenancePriority: z.string().optional(),
  maintenanceNotes: z.string().optional(),
  emergencyRoute: z.string().optional(),
  accessibility: z.string().optional(),
  trafficFlow: z.string().optional(),
});

// Room-specific schema
const roomFields = z.object({
  roomType: z.nativeEnum(RoomTypeEnum),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().optional(),
  roomNumber: z.string().optional(),
  parentRoomId: z.string().nullable(),
  storageType: z.nativeEnum(StorageTypeEnum).nullable(),
  storageNotes: z.string().optional(),
  phoneNumber: z.string().optional(),
  storageCapacity: z.number().nullable(),
});

// Create the discriminated union
export const createSpaceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("room") }).merge(baseSpaceSchema).merge(roomFields),
  z.object({ type: z.literal("hallway") }).merge(baseSpaceSchema).merge(hallwaySchema),
  z.object({ type: z.literal("door") }).merge(baseSpaceSchema).merge(doorSchema)
]);

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;

