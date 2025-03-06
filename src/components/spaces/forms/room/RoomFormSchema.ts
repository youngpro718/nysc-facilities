
import { z } from "zod";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../../rooms/types/roomEnums";

// Define connection schema for form usage
const roomConnectionSchema = z.object({
  id: z.string().uuid().optional(), // For existing connections
  toSpaceId: z.string().uuid().optional(),
  connectionType: z.string().optional(),
  direction: z.string().optional()
});

export const roomFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.nativeEnum(RoomTypeEnum),
  status: z.nativeEnum(StatusEnum),
  description: z.string().optional(),
  phoneNumber: z.string().optional(),
  isStorage: z.boolean().default(false),
  storageType: z.nativeEnum(StorageTypeEnum).nullable(),
  storageCapacity: z.number().nullable(),
  storageNotes: z.string().optional(),
  parentRoomId: z.string().uuid().nullable(),
  floorId: z.string().uuid(),
  currentFunction: z.string().optional(),
  connections: z.array(roomConnectionSchema).default([]),
  type: z.literal("room").default("room"),
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

export type RoomFormData = z.infer<typeof roomFormSchema>;
export type RoomConnectionData = z.infer<typeof roomConnectionSchema>;
