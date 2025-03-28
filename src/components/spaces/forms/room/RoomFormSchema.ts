import { z } from "zod";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../../rooms/types/roomEnums";

// Define connection directions as a constant for reuse
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

// Define the schema for room connections with improved validation
export const RoomConnectionSchema = z.object({
  toSpaceId: z.string().min(1, "Connected space is required"),
  connectionType: z.string().min(1, "Connection type is required"),
  direction: z.enum(ConnectionDirections, {
    errorMap: () => ({ message: "Please select a valid direction" })
  }).optional(),
  id: z.string().uuid().optional(), // Add id field for existing connections
});

// Get all enum values for RoomTypeEnum to use in the schema
const roomTypeValues = Object.values(RoomTypeEnum);

// Define the room form schema with all fields and improved validation
export const RoomFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  floorId: z.string().min(1, "Floor is required"),
  roomNumber: z.string().optional(),
  roomType: z.enum(roomTypeValues as [RoomTypeEnum, ...RoomTypeEnum[]], {
    errorMap: () => ({ message: "Please select a valid room type" })
  }),
  status: z.enum([
    StatusEnum.ACTIVE,
    StatusEnum.INACTIVE,
    StatusEnum.UNDER_MAINTENANCE,
  ], {
    errorMap: () => ({ message: "Please select a valid status" })
  }),
  description: z.string().optional(),
  phoneNumber: z.string().optional()
    .refine(val => !val || /^(\+\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(val), {
      message: "Invalid phone number format"
    }),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().default(false),
  // Make storage fields properly optional with validation
  storageType: z.enum([
    StorageTypeEnum.GENERAL,
    StorageTypeEnum.SECURE,
    StorageTypeEnum.CLIMATE_CONTROLLED,
    StorageTypeEnum.HAZARDOUS,
    StorageTypeEnum.ARCHIVE,
  ], {
    errorMap: () => ({ message: "Please select a valid storage type" })
  }).nullable().optional(),
  storageCapacity: z.number().nullable().optional(),
  storageNotes: z.string().nullable().optional(),
  // Make parentRoomId properly optional
  parentRoomId: z.string().nullable().optional(),
  connections: z.array(RoomConnectionSchema)
    .optional()
    .default([])
    .refine(connections => {
      // Check for duplicate connections to the same space
      const spaceIds = connections.map(conn => conn.toSpaceId);
      return new Set(spaceIds).size === spaceIds.length;
    }, {
      message: "Duplicate connections to the same space are not allowed"
    }),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  size: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  rotation: z.number().optional(),
  type: z.literal("room").default("room"),
  // Standardize property name to match database
  courtroomPhotos: z.object({
    judge_view: z.string().nullable().optional(),
    audience_view: z.string().nullable().optional()
  }).nullable().optional(),
}).refine(data => {
  // If isStorage is true, storageType should be provided
  return !data.isStorage || data.storageType !== undefined;
}, {
  message: "Storage type is required for storage rooms",
  path: ["storageType"]
});

// Export types derived from the schema
export type RoomFormData = z.infer<typeof RoomFormSchema>;

// Explicitly export the RoomConnectionData type to avoid circular dependencies
export interface RoomConnectionData {
  toSpaceId: string;
  connectionType: string;
  direction?: typeof ConnectionDirections[number];
  id?: string;
}
