
import { z } from "zod";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../rooms/types/roomEnums";

const baseSpaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  floorId: z.string().uuid("Invalid floor ID"),
  status: z.nativeEnum(StatusEnum),
  description: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }).default({ x: 0, y: 0 }),
  size: z.object({
    width: z.number(),
    height: z.number()
  }).default({ width: 150, height: 100 }),
  rotation: z.number().default(0),
});

const roomSchema = baseSpaceSchema.extend({
  type: z.literal("room"),
  roomNumber: z.string().min(1, "Room number is required"),
  phoneNumber: z.string().optional(),
  roomType: z.nativeEnum(RoomTypeEnum),
  parentRoomId: z.string().uuid("Invalid parent room ID").nullable().optional(),
  isStorage: z.boolean().default(false),
  storageCapacity: z.enum(['small', 'medium', 'large']).nullable().optional(),
  storageType: z.nativeEnum(StorageTypeEnum).nullable().optional(),
  storageNotes: z.string().nullable().optional(),
  currentFunction: z.string().optional(),
});

const doorSchema = baseSpaceSchema.extend({
  type: z.literal("door"),
  doorType: z.enum(["standard", "emergency", "secure", "maintenance"]),
  isTransitionDoor: z.boolean().default(false),
  hasClosingIssue: z.boolean().default(false),
  hasHandleIssue: z.boolean().default(false),
  windPressureIssues: z.boolean().default(false),
  issueNotes: z.string().optional(),
  closerStatus: z.enum(["functioning", "needs_adjustment", "not_working"]).optional(),
  securityLevel: z.enum(["standard", "restricted", "high_security"]).optional(),
  passkeyEnabled: z.boolean().default(false),
  maintenanceNotes: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
  maintenanceHistory: z.array(z.object({
    date: z.string(),
    workPerformed: z.string(),
    result: z.enum(["fixed", "needs_followup", "needs_replacement"]),
    notes: z.string().optional()
  })).optional(),
  statusHistory: z.array(z.object({
    status: z.string(),
    changedAt: z.string(),
    notes: z.string().optional()
  })).optional(),
  hardwareStatus: z.object({
    hinges: z.enum(["functional", "needs_repair", "needs_replacement"]).optional(),
    doorknob: z.enum(["functional", "needs_repair", "needs_replacement"]).optional(),
    lock: z.enum(["functional", "needs_repair", "needs_replacement"]).optional(),
    frame: z.enum(["functional", "needs_repair", "needs_replacement"]).optional(),
  }).optional(),
});

const hallwaySchema = baseSpaceSchema.extend({
  type: z.literal("hallway"),
  section: z.enum(["left_wing", "right_wing", "connector"]),
  hallwayType: z.enum(["public_main", "private_main", "private"]),
  trafficFlow: z.enum(["one_way", "two_way", "restricted"]).default("two_way"),
  accessibility: z.enum(["fully_accessible", "limited_access", "stairs_only", "restricted"]).default("fully_accessible"),
  emergencyRoute: z.enum(["primary", "secondary", "not_designated"]).default("not_designated"),
  maintenancePriority: z.enum(["low", "medium", "high"]).optional(),
  maintenanceNotes: z.string().optional(),
  maintenanceSchedule: z.array(z.object({
    date: z.string(),
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

export const editSpaceSchema = z.discriminatedUnion("type", [
  roomSchema,
  hallwaySchema,
  doorSchema,
]);

export type EditSpaceFormData = z.infer<typeof editSpaceSchema>;
export type RoomFormData = z.infer<typeof roomSchema>;
export type DoorFormData = z.infer<typeof doorSchema>;
export type HallwayFormData = z.infer<typeof hallwaySchema>;
