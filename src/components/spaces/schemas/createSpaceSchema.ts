import { z } from "zod";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../rooms/types/roomEnums";
import { 
  HallwaySection,
  HallwayType,
  TrafficFlow,
  Accessibility,
  EmergencyRoute
} from "../types/hallwayTypes";
import { ConnectionDirections } from "../forms/room/RoomFormSchema";

// Define connection schema with improved validation
const connectionSchema = z.object({
  toSpaceId: z.string().uuid("Invalid space ID").optional(),
  connectionType: z.string().optional(),
  direction: z.enum(ConnectionDirections, {
    errorMap: () => ({ message: "Please select a valid direction" })
  }).optional(),
  id: z.string().uuid("Invalid connection ID").optional()
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

// Define courtroom photos schema - standardized name to match database
const courtroomPhotosSchema = z.object({
  judge_view: z.string().nullable().optional(),
  audience_view: z.string().nullable().optional()
}).nullable().optional();

// Base schema for all space types with improved validation
const baseSpaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  buildingId: z.string().min(1, "Building is required"),
  floorId: z.string().min(1, "Floor is required"),
  status: z.nativeEnum(StatusEnum, {
    errorMap: () => ({ message: "Please select a valid status" })
  }),
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
  connections: z.array(connectionSchema).default([])
    .refine(connections => {
      // Check for duplicate connections to the same space
      const spaceIds = connections.filter(c => c.toSpaceId).map(conn => conn.toSpaceId);
      return new Set(spaceIds).size === spaceIds.length;
    }, {
      message: "Duplicate connections to the same space are not allowed"
    })
});

// Room-specific schema with improved validation
const roomSchema = baseSpaceSchema.extend({
  type: z.literal("room"),
  roomType: z.nativeEnum(RoomTypeEnum, {
    errorMap: () => ({ message: "Please select a valid room type" })
  }),
  roomNumber: z.string().optional(),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().default(false),
  phoneNumber: z.string().optional()
    .refine(val => !val || /^(\+\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(val), {
      message: "Invalid phone number format"
    }),
  storageType: z.nativeEnum(StorageTypeEnum, {
    errorMap: () => ({ message: "Please select a valid storage type" })
  }).nullable().optional(),
  storageCapacity: z.number().nullable().optional(),
  storageNotes: z.string().nullable().optional(),
  parentRoomId: z.string().nullable().optional(),
  // Standardize property name to match database
  courtroomPhotos: courtroomPhotosSchema
}).refine(data => {
  // If isStorage is true, storageType should be provided
  return !data.isStorage || data.storageType !== null;
}, {
  message: "Storage type is required for storage rooms",
  path: ["storageType"]
});

// Hallway-specific schema - enhanced with more specific hallway fields and proper enums
const hallwaySchema = baseSpaceSchema.extend({
  type: z.literal("hallway"),
  // Use proper enum types from hallwayTypes.ts for better type safety
  hallwayType: z.enum(["public_main", "private"], {
    errorMap: () => ({ message: "Please select a valid hallway type" })
  }).optional(),
  section: z.enum(["left_wing", "right_wing", "connector"], {
    errorMap: () => ({ message: "Please select a valid section" })
  }).optional(),
  maintenanceSchedule: z.array(maintenanceScheduleEntrySchema).optional(),
  emergencyExits: z.array(emergencyExitSchema).optional(),
  maintenancePriority: z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "Please select a valid maintenance priority" })
  }).optional(),
  maintenanceNotes: z.string().optional(),
  emergencyRoute: z.enum(["primary", "secondary", "not_designated"], {
    errorMap: () => ({ message: "Please select a valid emergency route" })
  }).optional(),
  accessibility: z.enum(["fully_accessible", "limited_access", "stairs_only", "restricted"], {
    errorMap: () => ({ message: "Please select a valid accessibility option" })
  }).optional(),
  trafficFlow: z.enum(["one_way", "two_way", "restricted"], {
    errorMap: () => ({ message: "Please select a valid traffic flow" })
  }).optional(),
  capacityLimit: z.number().optional(),
  width: z.number().optional(),
  length: z.number().optional()
});

// Door-specific schema with improved validation
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

// Fix the discriminated union to use the correct types
export const createSpaceSchema = z.discriminatedUnion("type", [
  roomSchema as any,
  hallwaySchema as any,
  doorSchema as any
]);

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;

// Export the connection schema type for reuse
export type ConnectionData = z.infer<typeof connectionSchema>;
