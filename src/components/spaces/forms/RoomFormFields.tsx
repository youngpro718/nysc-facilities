
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./room/RoomFormSchema";
import { BasicRoomFields } from "./room/BasicRoomFields";
import { FunctionFields } from "./room/FunctionFields";
import { CapacityFields } from "./room/CapacityFields";
import { StorageFields } from "./room/StorageFields";
import { StatusField } from "./room/StatusField";
import { CourtroomFields } from "./room/CourtroomFields";

interface FormFieldsProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
}

export function RoomFormFields({ form, floorId }: FormFieldsProps) {
  const roomIdValue = form.getValues()?.id || undefined; // Safe access with fallback

  return (
    <div className="space-y-6">
      <BasicRoomFields form={form} />
      
      <FunctionFields form={form} />
      
      <CapacityFields form={form} />
      
      <StorageFields form={form} />
      
      <CourtroomFields form={form} />
      
      <StatusField form={form} />
    </div>
  );
}
