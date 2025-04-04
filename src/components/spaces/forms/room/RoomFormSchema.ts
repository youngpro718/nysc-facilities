
import { z } from "zod";
import { RoomTypeEnum, StatusEnum } from "../../rooms/types/roomEnums";

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

// Define the room form schema with all fields and improved validation
export const RoomFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  floorId: z.string().min(1, "Floor is required"),
  roomNumber: z.string().optional(),
  roomType: z.nativeEnum(RoomTypeEnum, {
    errorMap: () => ({ message: "Please select a valid room type" })
  }),
  status: z.nativeEnum(StatusEnum, {
    errorMap: () => ({ message: "Please select a valid status" })
  }),
  description: z.string().optional(),
  phoneNumber: z.string().optional()
    .refine(val => !val || /^(\+\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(val), {
      message: "Invalid phone number format"
    }),
  currentFunction: z.string().optional(),
  isStorage: z.boolean().default(false),
  storageType: z.string().nullable().optional(),
  storageCapacity: z.number().nullable().optional(),
  storageNotes: z.string().nullable().optional(),
  parentRoomId: z.string().nullable().optional(),
  connections: z.array(RoomConnectionSchema)
    .optional()
    .default([]),
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
  courtroomPhotos: z.object({
    judge_view: z.string().nullable().optional(),
    audience_view: z.string().nullable().optional()
  }).nullable().optional(),
});

// Export types derived from the schema
export type RoomFormData = z.infer<typeof RoomFormSchema>;
