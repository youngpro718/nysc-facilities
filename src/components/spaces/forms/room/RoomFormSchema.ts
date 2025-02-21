
import { z } from "zod";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../../rooms/types/roomEnums";
import { StorageCapacityEnum } from "../../schemas/createSpaceSchema";

export { StorageCapacityEnum };
export type StorageCapacityType = z.infer<typeof StorageCapacityEnum>;

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
  storageCapacity: z.nativeEnum(StorageCapacityEnum).nullable(),
  storageNotes: z.string().optional(),
  parentRoomId: z.string().uuid().nullable(),
  floorId: z.string().uuid(),
  currentFunction: z.string().optional(),
  // Additional room-specific fields here
});

export type RoomFormData = z.infer<typeof roomFormSchema>;

