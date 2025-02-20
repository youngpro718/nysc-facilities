
import { z } from "zod";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../../rooms/types/roomEnums";
import { StorageCapacityEnum, type StorageCapacityType } from "../../schemas/createSpaceSchema";

export { StorageCapacityType };

export const roomFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.nativeEnum(RoomTypeEnum, {
    required_error: "Room type is required"
  }),
  status: z.nativeEnum(StatusEnum, {
    required_error: "Status is required"
  }),
  description: z.string().optional(),
  phoneNumber: z.string().optional(),
  isStorage: z.boolean().default(false),
  storageType: z.nativeEnum(StorageTypeEnum).nullable().optional(),
  storageCapacity: z.enum([
    StorageCapacityEnum.SMALL,
    StorageCapacityEnum.MEDIUM,
    StorageCapacityEnum.LARGE
  ]).nullable().optional(),
  storageNotes: z.string().optional(),
  parentRoomId: z.string().uuid().nullable().optional(),
  floorId: z.string().uuid("Invalid floor ID"),
  currentFunction: z.string().optional(),
});

export type RoomFormData = z.infer<typeof roomFormSchema>;
