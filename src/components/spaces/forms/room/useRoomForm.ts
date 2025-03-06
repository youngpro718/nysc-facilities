
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { roomFormSchema, type RoomFormData } from "./RoomFormSchema";
import { RoomTypeEnum, StatusEnum } from "../../rooms/types/roomEnums";

export function useRoomForm(defaultValues?: Partial<RoomFormData>) {
  return useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      type: "room",
      status: StatusEnum.ACTIVE,
      roomType: RoomTypeEnum.OFFICE,
      isStorage: false,
      storageType: null,
      storageCapacity: null,
      connections: [],
      ...defaultValues,
    },
  });
}
