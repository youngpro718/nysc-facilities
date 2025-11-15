
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoomFormData, RoomFormSchema } from "./RoomFormSchema";

export function useRoomForm(defaultValues?: Partial<RoomFormData>) {
  const form = useForm<RoomFormData>({
    resolver: zodResolver(RoomFormSchema),
    defaultValues: {
      type: "room",
      connections: [],
      ...defaultValues,
    }
  });
  
  return form;
}
