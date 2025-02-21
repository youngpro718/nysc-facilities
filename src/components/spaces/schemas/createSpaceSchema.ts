
import { z } from "zod";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

// Define common enums
export const StorageCapacityEnum = z.enum(["small", "medium", "large"]);

// Define the door schema fields
const doorSchema = z.object({
  doorType: z.string().optional(),
  closerStatus: z.string().optional(),
  windPressureIssues: z.boolean().optional(),
  hardwareStatus: z.object({
    frame: z.string(),
    hinges: z.string(),
    doorknob: z.string(),
    lock: z.string()
  }).optional(),
  nextMaintenanceDate: z.date().optional(),
});

// Define the hallway schema fields
const hallwaySchema = z.object({
  hallwayType: z.string().optional(),
  maintenanceSchedule: z.array(z.object({
    date: z.date(),
    type: z.string(),
    status: z.string(),
    assignedTo: z.string().optional()
  })).optional(),
  emergencyExits: z.array(z.object({
    location: z.string(),
    type: z.string(),
    notes: z.string().optional()
  })).optional(),
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
  rotation: z.number().optional()
});

// Room-specific fields
const roomFields = z.object({
  roomType: z.nativeEnum(RoomTypeEnum),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().optional(),
  roomNumber: z.string().optional(),
  parentRoomId: z.string().nullable(),
  storageCapacity: z.number().nullable(),
  storageType: z.nativeEnum(StorageTypeEnum).nullable(),
  storageNotes: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export const createSpaceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("room") }).merge(baseSpaceSchema).merge(roomFields),
  z.object({ type: z.literal("hallway") }).merge(baseSpaceSchema).merge(hallwaySchema),
  z.object({ type: z.literal("door") }).merge(baseSpaceSchema).merge(doorSchema)
]);

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;
