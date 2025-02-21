
import { z } from "zod";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

// Define common enums
export const StorageCapacityEnum = z.enum(["small", "medium", "large"]);

export type StorageCapacityType = z.infer<typeof StorageCapacityEnum>;

// Define base schema for common fields
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
  rotation: z.number().optional()
});

// Connection schema
const connectionSchema = z.object({
  toSpaceId: z.string().optional(),
  connectionType: z.enum(["door", "hallway", "direct"]).optional(),
  direction: z.enum(["north", "south", "east", "west", "adjacent"]).optional(),
});

// Room-specific fields
const roomFields = z.object({
  roomType: z.nativeEnum(RoomTypeEnum),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().optional(),
  roomNumber: z.string().optional(),
  parentRoomId: z.string().nullable(),
  storageCapacity: StorageCapacityEnum.nullable(),
  storageType: z.nativeEnum(StorageTypeEnum).nullable(),
  storageNotes: z.string().optional(),
  phoneNumber: z.string().optional(),
  connections: connectionSchema.optional(),
});

// Hallway-specific fields
const hallwayFields = z.object({
  section: z.string().optional(),
  trafficFlow: z.enum(['one_way', 'two_way']).optional(),
  accessibility: z.enum(['fully_accessible', 'partially_accessible', 'not_accessible']).optional(),
  maintenanceNotes: z.string().optional(),
  maintenancePriority: z.string().optional(),
  emergencyRoute: z.string().optional(),
  connections: connectionSchema.optional(),
});

// Door-specific fields
const doorFields = z.object({
  securityLevel: z.string().optional(),
  passkeyEnabled: z.boolean().optional(),
  connections: connectionSchema.optional(),
});

// Create discriminated union based on type
export const createSpaceSchema = baseSpaceSchema.and(
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("room") }).merge(roomFields),
    z.object({ type: z.literal("hallway") }).merge(hallwayFields),
    z.object({ type: z.literal("door") }).merge(doorFields),
  ])
);

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;

