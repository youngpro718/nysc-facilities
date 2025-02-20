
import { z } from "zod";
import { RoomTypeEnum, StorageTypeEnum, StatusEnum } from "../../rooms/types/roomEnums";

export const roomFormSchema = z.object({
  id: z.string().uuid().optional(), // Add id field
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
  storageCapacity: z.number().nullable().optional(),
  storageNotes: z.string().optional(),
  parentRoomId: z.string().uuid().nullable().optional(),
  floorId: z.string().uuid("Invalid floor ID"),
  currentFunction: z.string().optional(),
});

export type RoomFormData = z.infer<typeof roomFormSchema>;
