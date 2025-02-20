
import { UseFormReturn } from "react-hook-form";
import { EditSpaceFormData } from "../schemas/editSpaceSchema";
import { BasicRoomFields } from "./room/BasicRoomFields";
import { ParentRoomField } from "./room/ParentRoomField";
import { StorageFields } from "./room/StorageFields";
import { StatusField } from "./room/StatusField";

type RoomForm = Extract<EditSpaceFormData, { type: "room" }>;

interface RoomFormFieldsProps {
  form: UseFormReturn<RoomForm>;
  floorId: string;
}

export function RoomFormFields({ form, floorId }: RoomFormFieldsProps) {
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
      
      <StatusField form={form} />
    </div>
  );
}
