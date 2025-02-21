
import { z } from "zod";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../../rooms/types/roomEnums";

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
});

export type RoomFormData = z.infer<typeof roomFormSchema>;
