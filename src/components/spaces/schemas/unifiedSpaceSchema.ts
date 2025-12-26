import { z } from "zod";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../rooms/types/roomEnums";

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

// Unified connection schema
export const UnifiedConnectionSchema = z.object({
  toSpaceId: z.string().min(1, "Connected space is required"),
  connectionType: z.string().min(1, "Connection type is required"),
  direction: z.enum(ConnectionDirections).optional(),
  id: z.string().uuid().optional(),
});

// Courtroom photos schema - supports multiple photos per view
const courtroomPhotosSchema = z.object({
  judge_view: z.array(z.string()).nullable().optional(),
  audience_view: z.array(z.string()).nullable().optional()
}).nullable().optional();

// Base space schema with common fields
const baseSpaceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  buildingId: z.string().min(1, "Building is required").optional(), // Optional for edit mode
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
  connections: z.array(UnifiedConnectionSchema).default([]),
  status: z.nativeEnum(StatusEnum).default(StatusEnum.ACTIVE),
});

// Room-specific schema
const roomSchema = baseSpaceSchema.extend({
  type: z.literal("room").default("room"),
  roomType: z.nativeEnum(RoomTypeEnum),
  roomNumber: z.string().optional(),
  currentFunction: z.string().optional(),
  phoneNumber: z.string().optional(),
  isStorage: z.boolean().default(false),
  storageType: z.nativeEnum(StorageTypeEnum).nullable().optional(),
  storageCapacity: z.number().nullable().optional(),
  storageNotes: z.string().nullable().optional(),
  parentRoomId: z.string().nullable().optional(),
  courtroom_photos: courtroomPhotosSchema,
});

// Hallway-specific schema
const hallwaySchema = baseSpaceSchema.extend({
  type: z.literal("hallway"),
  hallwayType: z.enum(["public_main", "private"]).optional(),
  section: z.enum(["left_wing", "right_wing", "connector"]).optional(),
  maintenancePriority: z.enum(["low", "medium", "high"]).optional(),
  maintenanceNotes: z.string().optional(),
  emergencyRoute: z.enum(["primary", "secondary", "not_designated"]).optional(),
  accessibility: z.enum(["fully_accessible", "limited_access", "stairs_only", "restricted"]).optional(),
  trafficFlow: z.enum(["one_way", "two_way", "restricted"]).optional(),
  capacityLimit: z.number().optional(),
  width: z.number().optional(),
  length: z.number().optional(),
});

// Door-specific schema
const doorSchema = baseSpaceSchema.extend({
  type: z.literal("door"),
  doorType: z.string().optional(),
  securityLevel: z.string().optional(),
  passkeyEnabled: z.boolean().optional(),
  closerStatus: z.string().optional(),
  windPressureIssues: z.boolean().optional(),
  nextMaintenanceDate: z.string().optional(),
  maintenanceNotes: z.string().optional(),
});

// Unified schema that works for both create and edit
export const unifiedSpaceSchema = z.discriminatedUnion("type", [
  roomSchema,
  hallwaySchema,
  doorSchema
]);

// For create mode, require buildingId
export const createSpaceSchema = unifiedSpaceSchema.transform(data => {
  if (!data.buildingId) {
    throw new Error("Building is required for creating spaces");
  }
  return data;
});

// For edit mode, buildingId is optional
export const editSpaceSchema = unifiedSpaceSchema;

export type UnifiedSpaceFormData = z.infer<typeof unifiedSpaceSchema>;
export type UnifiedConnectionData = z.infer<typeof UnifiedConnectionSchema>;