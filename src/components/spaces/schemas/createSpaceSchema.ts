
import { z } from "zod";
import { RoomTypeEnum, StatusEnum } from "../rooms/types/roomEnums";

// Base space schema with common fields
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
  connections: z.array(
    z.object({
      toSpaceId: z.string().optional(),
      connectionType: z.string().optional(),
      direction: z.string().optional()
    })
  ).transform(connections => 
    connections.filter(conn => conn.toSpaceId && conn.connectionType)
  ).optional(),
});

// Room specific schema
const roomSchema = baseSpaceSchema.extend({
  type: z.literal("room"),
  roomNumber: z.string().optional(),
  roomType: z.nativeEnum(RoomTypeEnum),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().default(false),
  storageType: z.string().nullable().optional(),
  storageCapacity: z.number().nullable().optional(),
  storageNotes: z.string().nullable().optional(),
  parentRoomId: z.string().nullable().optional(),
  phoneNumber: z.string().optional(),
  courtroomPhotos: z.object({
    judge_view: z.string().nullable().optional(),
    audience_view: z.string().nullable().optional()
  }).nullable().optional(),
});

// Hallway specific schema
const hallwaySchema = baseSpaceSchema.extend({
  type: z.literal("hallway"),
  section: z.string().optional(),
  hallwayType: z.string().optional(),
  trafficFlow: z.string().optional(),
  accessibility: z.string().optional(),
  emergencyRoute: z.string().optional(),
  maintenancePriority: z.string().optional(),
  capacityLimit: z.number().optional(),
});

// Door specific schema
const doorSchema = baseSpaceSchema.extend({
  type: z.literal("door"),
  doorType: z.string().optional(),
  isTransitionDoor: z.boolean().optional(),
  securityLevel: z.string().optional(),
  hasClosingIssue: z.boolean().optional(),
  hasHandleIssue: z.boolean().optional(),
});

// Complete discriminated union
export const createSpaceSchema = z.discriminatedUnion("type", [
  roomSchema,
  hallwaySchema,
  doorSchema
]);

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;
export type RoomFormData = z.infer<typeof roomSchema>;
export type HallwayFormData = z.infer<typeof hallwaySchema>;
export type DoorFormData = z.infer<typeof doorSchema>;
