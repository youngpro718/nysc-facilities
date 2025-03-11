
import { z } from "zod";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../../rooms/types/roomEnums";

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

// Define the schema for room connections
export const RoomConnectionSchema = z.object({
  toSpaceId: z.string().min(1, "Connected space is required"),
  connectionType: z.string().min(1, "Connection type is required"),
  direction: z.enum(ConnectionDirections).optional(),
});

// Define the room form schema with all fields
export const RoomFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  floorId: z.string().min(1, "Floor is required"),
  roomNumber: z.string().optional(),
  roomType: z.enum([
    RoomTypeEnum.OFFICE,
    RoomTypeEnum.COURTROOM,
    RoomTypeEnum.STORAGE,
    RoomTypeEnum.MEETING, // Using MEETING instead of CONFERENCE
    RoomTypeEnum.UTILITY,
    RoomTypeEnum.RECEPTION,
    // Removed DEFAULT, RESTROOM, SECURITY as they don't exist in the enum
  ]),
  status: z.enum([
    StatusEnum.ACTIVE,
    StatusEnum.INACTIVE,
    StatusEnum.UNDER_MAINTENANCE,
  ]),
  description: z.string().optional(),
  phoneNumber: z.string().optional(),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().default(false),
  storageType: z.enum([
    StorageTypeEnum.GENERAL,
    StorageTypeEnum.SECURE,
    StorageTypeEnum.CLIMATE_CONTROLLED,
    StorageTypeEnum.HAZARDOUS,
    StorageTypeEnum.ARCHIVE,
    // Removed FILE, EQUIPMENT, SUPPLIES as they don't exist in the enum
  ]).optional(),
  storageCapacity: z.number().optional(),
  parentRoomId: z.string().optional(),
  connections: z.array(RoomConnectionSchema).optional(),
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
  courtRoomPhotos: z.object({
    judge_view: z.string().nullable().optional(),
    audience_view: z.string().nullable().optional()
  }).nullable().optional(),
});

// Export types derived from the schema
export type RoomFormData = z.infer<typeof RoomFormSchema>;
export type RoomConnectionData = z.infer<typeof RoomConnectionSchema>;
