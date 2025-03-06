
import { UseFormReturn, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoomFormData, roomFormSchema } from "./RoomFormSchema";
import { RoomTypeEnum, StatusEnum } from "../../rooms/types/roomEnums";

export function useRoomForm(initialData?: Partial<RoomFormData>): UseFormReturn<RoomFormData> {
  return useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      type: "room" as const,
      status: StatusEnum.ACTIVE,
      roomType: RoomTypeEnum.OFFICE,
      name: "",
      roomNumber: "",
      description: "",
      isStorage: false,
      storageType: null,
      storageCapacity: null,
      storageNotes: "",
      parentRoomId: null,
      connections: [],
      ...initialData
    },
  });
}
