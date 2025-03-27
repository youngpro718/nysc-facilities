
import { z } from "zod";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "../../rooms/types/roomEnums";

// Define allowed connection directions
export const ConnectionDirections = ['north', 'south', 'east', 'west', 'above', 'below'] as const;

// Schema for courtroom photos
const courtroomPhotosSchema = z.object({
  judge_view: z.string().url().nullable(),
  audience_view: z.string().url().nullable(),
}).nullable().optional();

// Schema definition for space connections
const connectionSchema = z.object({
  id: z.string().optional(),
  toSpaceId: z.string().uuid().optional().nullable(),
  connectionType: z.string().optional().nullable(),
  direction: z.enum(ConnectionDirections).optional(),
});

// Define the schema for the room form
export const RoomFormSchema = z.object({
  id: z.string().uuid().optional(),
  
  // Basic Details
  type: z.literal("room"),
  name: z.string().min(1, "Name is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  description: z.string().optional().nullable(),
  
  // Room Properties
  roomType: z.nativeEnum(RoomTypeEnum).optional().nullable(),
  status: z.nativeEnum(StatusEnum).default(StatusEnum.ACTIVE),
  floorId: z.string().uuid().optional(),
  parentRoomId: z.string().uuid().optional().nullable(),
  
  // For storage rooms
  isStorage: z.boolean().default(false),
  storageType: z.nativeEnum(StorageTypeEnum).optional().nullable(),
  storageCapacity: z.number().optional().nullable(),
  storageNotes: z.string().optional().nullable(),
  
  // Additional fields
  currentFunction: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  
  // For courtrooms
  courtroom_photos: courtroomPhotosSchema,
  
  // Connections to other spaces
  connections: z.array(connectionSchema).default([]),
});

// Define the type from the schema
export type RoomFormData = z.infer<typeof RoomFormSchema>;

// Ensure all room types are accounted for in the schema
export type RoomType = RoomTypeEnum;
