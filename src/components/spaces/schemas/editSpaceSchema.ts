
import { z } from "zod";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../rooms/types/roomEnums";

const baseSpaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  floorId: z.string().uuid("Invalid floor ID"),
  status: z.nativeEnum(StatusEnum),
});

const positionSchema = z.object({
  x: z.number(),
  y: z.number()
}).default({ x: 0, y: 0 });

const sizeSchema = z.object({
  width: z.number(),
  height: z.number()
}).default({ width: 150, height: 100 });

export const roomSchema = baseSpaceSchema.extend({
  type: z.literal("room"),
  roomNumber: z.string().min(1, "Room number is required"),
  phoneNumber: z.string().optional(),
  roomType: z.nativeEnum(RoomTypeEnum),
  description: z.string().optional(),
  parentRoomId: z.string().uuid("Invalid parent room ID").nullable().optional(),
  isStorage: z.boolean().default(false),
  storageCapacity: z.number().nullable().optional(),
  storageType: z.nativeEnum(StorageTypeEnum).nullable().optional(),
  storageNotes: z.string().nullable().optional(),
  currentFunction: z.string().optional(),
  position: positionSchema,
  size: sizeSchema,
  rotation: z.number().default(0),
});

const doorSchema = baseSpaceSchema.extend({
  type: z.literal("door"),
  doorType: z.enum(["standard", "emergency", "secure", "maintenance"]),
  securityLevel: z.enum(["standard", "restricted", "high_security"]).default("standard"),
  passkeyEnabled: z.boolean().default(false),
  nextMaintenanceDate: z.string().optional(),
  maintenanceNotes: z.string().optional(),
  closerStatus: z.enum(["functioning", "needs_adjustment", "not_working"]).default("functioning"),
  windPressureIssues: z.boolean().default(false),
  lastHardwareCheck: z.string().optional(),
  hardwareStatus: z.object({
    hinges: z.enum(["functional", "needs_repair", "needs_replacement"]),
    doorknob: z.enum(["functional", "needs_repair", "needs_replacement"]),
    lock: z.enum(["functional", "needs_repair", "needs_replacement"]),
    frame: z.enum(["functional", "needs_repair", "needs_replacement"])
  }).default({
    hinges: "functional",
    doorknob: "functional",
    lock: "functional",
    frame: "functional"
  }),
  componentIssues: z.object({
    closer: z.array(z.string()),
    hinges: z.array(z.string()),
    doorknob: z.array(z.string()),
    lock: z.array(z.string()),
    frame: z.array(z.string())
  }).default({
    closer: [],
    hinges: [],
    doorknob: [],
    lock: [],
    frame: []
  }),
  inspectionChecklist: z.object({
    closer_tension: z.string().nullable(),
    hinge_alignment: z.string().nullable(),
    lock_mechanism: z.string().nullable(),
    weather_stripping: z.string().nullable(),
    frame_alignment: z.string().nullable(),
    last_checked: z.string().nullable()
  }).nullable().optional(),
  statusHistory: z.array(z.object({
    status: z.string(),
    changed_at: z.string(),
    previous_status: z.string()
  })).optional(),
  maintenanceHistory: z.array(z.object({
    date: z.string(),
    type: z.string(),
    notes: z.string().optional(),
    performed_by: z.string().optional()
  })).optional(),
  securityConfig: z.object({
    access_levels: z.array(z.string()),
    restricted_times: z.array(z.object({
      start: z.string(),
      end: z.string(),
      days: z.array(z.string())
    })),
    emergency_contacts: z.array(z.object({
      name: z.string(),
      phone: z.string(),
      role: z.string()
    })),
    emergency_override: z.boolean()
  }).optional()
});

const hallwaySchema = baseSpaceSchema.extend({
  type: z.literal("hallway"),
  section: z.enum(["left_wing", "right_wing", "connector"]),
  hallwayType: z.enum(["public_main", "private"]),
  notes: z.string().optional(),
  maintenance_priority: z.string().optional(),
  maintenance_notes: z.string().optional(),
  description: z.string().optional(),
  traffic_flow: z.enum(["one_way", "two_way", "restricted"]).default("two_way"),
  accessibility: z.enum(["fully_accessible", "limited_access", "stairs_only", "restricted"]).default("fully_accessible"),
  emergency_route: z.enum(["primary", "secondary", "not_designated"]).default("not_designated"),
  security_level: z.enum(["standard", "high", "restricted"]).default("standard"),
  emergency_exits: z.array(z.object({
    location: z.string(),
    type: z.string(),
    notes: z.string().optional()
  })).default([]),
  maintenance_schedule: z.array(z.object({
    date: z.string(),
    type: z.string(),
    status: z.string(),
    assigned_to: z.string().optional()
  })).default([])
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
