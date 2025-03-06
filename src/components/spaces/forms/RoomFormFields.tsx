
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./room/RoomFormSchema";
import { BasicRoomFields } from "./room/BasicRoomFields";
import { ParentRoomField } from "./room/ParentRoomField";
import { StorageFields } from "./room/StorageFields";
import { StatusField } from "./room/StatusField";
import { ConnectionsField } from "./room/ConnectionsField";

interface FormFieldsProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
}

export function RoomFormFields({ form, floorId }: FormFieldsProps) {
  const currentRoomId = form.getValues("id");

  return (
    <div className="space-y-6">
      <BasicRoomFields form={form} />
      
      <ParentRoomField 
        form={form} 
        floorId={floorId} 
        currentRoomId={currentRoomId} 
      />
      
      <StorageFields form={form} />
      
      {floorId && (
        <ConnectionsField
          form={form}
          floorId={floorId}
          roomId={currentRoomId}
        />
      )}
      
      <StatusField form={form} />
    </div>
  );
}
