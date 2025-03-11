
import { z } from "zod";

// Valid directions for connections
export const ConnectionDirections = ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"] as const;
export type ConnectionDirection = typeof ConnectionDirections[number];

export const RoomConnectionSchema = z.object({
  id: z.string().optional(),
  toSpaceId: z.string().min(1, "Connected space is required"),
  connectionType: z.string().min(1, "Connection type is required"),
  direction: z.enum(ConnectionDirections).optional()
});

export type RoomConnectionData = z.infer<typeof RoomConnectionSchema>;

export const RoomFormSchema = z.object({
  id: z.string().optional(), // Add id to the schema
  name: z.string().min(1, "Name is required"),
  roomNumber: z.string().optional(),
  roomType: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  phoneNumber: z.string().optional(),
  isStorage: z.boolean().optional(),
  storageType: z.string().nullable().optional(),
  storageCapacity: z.number().nullable().optional(),
  storageNotes: z.string().nullable().optional(),
  parentRoomId: z.string().nullable().optional(),
  floorId: z.string().min(1, "Floor is required"),
  currentFunction: z.string().optional(),
  connections: z.array(RoomConnectionSchema).optional(),
  type: z.literal("room"),
  courtRoomPhotos: z.object({
    judge_view: z.string().nullable().optional(),
    audience_view: z.string().nullable().optional()
  }).nullable().optional()
});

// Export RoomFormSchema as roomFormSchema for compatibility with existing imports
export const roomFormSchema = RoomFormSchema;

export type RoomFormData = z.infer<typeof RoomFormSchema>;
