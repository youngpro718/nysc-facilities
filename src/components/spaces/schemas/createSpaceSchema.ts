
import { z } from "zod";
import { RoomTypeEnum, StatusEnum } from "../rooms/types/roomEnums";

export const createSpaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["room", "hallway", "door"]),
  buildingId: z.string().min(1, "Building is required"),
  floorId: z.string().min(1, "Floor is required"),
  status: z.nativeEnum(StatusEnum),
  roomType: z.nativeEnum(RoomTypeEnum).optional(),
  currentFunction: z.string().optional(),
  description: z.string().optional(),
  isStorage: z.boolean().optional(),
  roomNumber: z.string().optional(),
  parentRoomId: z.string().nullable(),
  storageCapacity: z.number().nullable(),
  storageType: z.string().nullable(),
  storageNotes: z.string().optional(),
});

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;
