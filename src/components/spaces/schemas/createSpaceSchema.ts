
import { z } from "zod";
import { connectionSchema } from "./connectionSchema";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../rooms/types/roomEnums";

const directionEnum = z.enum(["north", "south", "east", "west", "adjacent"]);
export type Direction = z.infer<typeof directionEnum>;

export const StorageCapacityEnum = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const;

export type StorageCapacityType = typeof StorageCapacityEnum[keyof typeof StorageCapacityEnum];

const maintenanceStatusEnum = z.enum(["functional", "needs_repair", "under_maintenance"]);
const emergencyRouteEnum = z.enum(["primary", "secondary", "not_designated"]);
const trafficFlowEnum = z.enum(["one_way", "two_way"]);
const accessibilityEnum = z.enum(["fully_accessible", "limited_access", "not_accessible"]);

const baseSpaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  floorId: z.string().uuid("Invalid floor ID"),
  status: z.nativeEnum(StatusEnum).default(StatusEnum.ACTIVE),
  connections: z.object({
    toSpaceId: z.string().uuid("Invalid space ID").optional(),
    connectionType: z.enum(["door", "hallway", "direct"]).optional(),
    direction: directionEnum.optional(),
  }).optional(),
  description: z.string().optional(),
  maintenanceNotes: z.string().optional(),
  maintenancePriority: z.enum(["low", "medium", "high"]).optional(),
  maintenanceSchedule: z.array(z.object({
    date: z.string(),
    type: z.string(),
    status: z.string(),
    assignedTo: z.string(),
    notes: z.string().optional()
  })).optional().default([]),
});

const doorSchema = baseSpaceSchema.extend({
  type: z.literal("door"),
  doorType: z.enum(["standard", "emergency", "secure", "maintenance"]),
  securityLevel: z.enum(["standard", "restricted", "high_security"]).default("standard"),
  passkeyEnabled: z.boolean().default(false),
  closerStatus: z.string().optional(),
  windPressureIssues: z.boolean().optional(),
  hardwareStatus: z.object({
    frame: z.string(),
    hinges: z.string(),
    doorknob: z.string(),
    lock: z.string()
  }).optional(),
  nextMaintenanceDate: z.string().optional(),
  statusHistory: z.array(z.object({
    date: z.string(),
    status: z.string(),
    notes: z.string()
  })).optional().default([])
});

const hallwaySchema = baseSpaceSchema.extend({
  type: z.literal("hallway"),
  section: z.enum(["left_wing", "right_wing", "connector"]),
  hallwayType: z.enum(["public_main", "private"]),
  trafficFlow: trafficFlowEnum.optional(),
  accessibility: accessibilityEnum.optional(),
  emergencyRoute: emergencyRouteEnum.optional(),
  emergencyExits: z.array(z.object({
    location: z.string(),
    type: z.string(),
    notes: z.string().optional()
  })).optional().default([])
});

const roomSchema = baseSpaceSchema.extend({
  type: z.literal("room"),
  roomNumber: z.string().min(1, "Room number is required"),
  phoneNumber: z.string().optional(),
  roomType: z.nativeEnum(RoomTypeEnum),
  parentRoomId: z.string().uuid("Invalid parent room ID").nullable().optional(),
  isStorage: z.boolean().default(false),
  storageCapacity: z.enum([StorageCapacityEnum.SMALL, StorageCapacityEnum.MEDIUM, StorageCapacityEnum.LARGE]).nullable().optional(),
  storageType: z.nativeEnum(StorageTypeEnum).nullable().optional(),
  storageNotes: z.string().nullable().optional(),
  currentFunction: z.string().optional(),
});

export const createSpaceSchema = z.discriminatedUnion("type", [
  roomSchema,
  hallwaySchema,
  doorSchema,
]).refine(
  (data) => {
    if (data.type === "room" && data.isStorage && !data.storageType) {
      return false;
    }
    return true;
  },
  {
    message: "Storage type is required when room is marked as storage",
    path: ["storageType"],
  }
);

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;
