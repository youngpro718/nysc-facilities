
import { z } from "zod";
import { RoomTypeEnum, StatusEnum } from "../rooms/types/roomEnums";

// Define common enums
export enum StorageCapacityEnum {
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large"
}

export type StorageCapacityType = z.infer<typeof storageCapacitySchema>;

export const storageCapacitySchema = z.nativeEnum(StorageCapacityEnum);

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

// Room-specific fields
const roomFields = z.object({
  roomType: z.nativeEnum(RoomTypeEnum),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().optional(),
  roomNumber: z.string().optional(),
  parentRoomId: z.string().nullable(),
  storageCapacity: storageCapacitySchema.nullable(),
  storageType: z.string().nullable(),
  storageNotes: z.string().optional(),
  phoneNumber: z.string().optional(),
});

// Hallway-specific fields
const hallwayFields = z.object({
  section: z.string().optional(),
  trafficFlow: z.enum(['one_way', 'two_way']).optional(),
  hallwayType: z.string().optional(),
  accessibility: z.enum(['fully_accessible', 'partially_accessible', 'not_accessible']).optional(),
  maintenanceSchedule: z.array(z.object({
    date: z.string(),
    type: z.string(),
    status: z.string(),
    assignedTo: z.string().optional(),
  })).optional(),
  maintenanceNotes: z.string().optional(),
  maintenancePriority: z.string().optional(),
  emergencyRoute: z.string().optional(),
  emergencyExits: z.array(z.object({
    location: z.string(),
    type: z.string(),
    notes: z.string().optional(),
  })).optional(),
});

// Door-specific fields
const doorFields = z.object({
  doorType: z.string().optional(),
  securityLevel: z.string().optional(),
  passkeyEnabled: z.boolean().optional(),
  closerStatus: z.string().optional(),
  windPressureIssues: z.boolean().optional(),
  hardwareStatus: z.object({
    frame: z.string(),
    hinges: z.string(),
    doorknob: z.string(),
    lock: z.string(),
  }).optional(),
  maintenanceNotes: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
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
