
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoomFormSchema, RoomFormData } from "./RoomFormSchema";

export const useRoomForm = (defaultValues?: Partial<RoomFormData>) => {
  return useForm<RoomFormData>({
    resolver: zodResolver(RoomFormSchema),
    defaultValues: {
      type: "room",
      connections: [],
      ...defaultValues
    }
  });
};
