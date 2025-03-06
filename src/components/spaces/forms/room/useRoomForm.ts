
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { roomFormSchema, RoomFormData } from "./RoomFormSchema";

export function useRoomForm(defaultValues?: Partial<RoomFormData>) {
  return useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      type: "room",
      isStorage: false,
      connections: [],
      ...defaultValues,
    },
  });
}
