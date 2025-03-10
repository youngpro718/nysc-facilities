
import { z } from "zod";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../../rooms/types/roomEnums";

// Define connection schema for form usage
export const roomConnectionSchema = z.object({
  id: z.string().uuid().optional(), // For existing connections
  toSpaceId: z.string().uuid(),
  connectionType: z.string(),
  direction: z.string().optional()
});

// Define the courtroom photos schema
export const courtRoomPhotosSchema = z.object({
  judge_view: z.string().nullable().optional(),
  audience_view: z.string().nullable().optional()
});

export const roomFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.nativeEnum(RoomTypeEnum),
  status: z.nativeEnum(StatusEnum),
  description: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  isStorage: z.boolean().default(false),
  storageType: z.nativeEnum(StorageTypeEnum).nullable().optional(),
  storageCapacity: z.number().nullable().optional(),
  storageNotes: z.string().optional().nullable(),
  parentRoomId: z.string().uuid().nullable().optional(),
  floorId: z.string().uuid(),
  buildingId: z.string().uuid().optional(),
  currentFunction: z.string().optional().nullable(),
  connections: z.array(roomConnectionSchema).default([]),
  type: z.literal("room"), // Ensure this is always provided
  position: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  size: z.object({
    width: z.number(),
    height: z.number()
  }).optional(),
  rotation: z.number().optional(),
  courtRoomPhotos: courtRoomPhotosSchema.optional()
});

export type RoomFormData = z.infer<typeof roomFormSchema>;
export type RoomConnectionData = z.infer<typeof roomConnectionSchema>;
