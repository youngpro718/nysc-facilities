
import { UseFormReturn } from "react-hook-form";
import { EditSpaceFormData, RoomFormData } from "../schemas/editSpaceSchema";
import { BasicRoomFields } from "./room/BasicRoomFields";
import { ParentRoomField } from "./room/ParentRoomField";
import { StorageFields } from "./room/StorageFields";
import { StatusField } from "./room/StatusField";

interface RoomFormFieldsProps {
  form: UseFormReturn<EditSpaceFormData>;
  floorId: string;
}

export function RoomFormFields({ form, floorId }: RoomFormFieldsProps) {
  const currentRoomId = form.getValues("id");

  // Type assertion to handle room-specific form fields
  const roomForm = form as UseFormReturn<RoomFormData>;

  return (
    <div className="space-y-6">
      <BasicRoomFields form={roomForm} />
      
      <ParentRoomField 
        form={roomForm} 
        floorId={floorId} 
        currentRoomId={currentRoomId} 
      />
      
      <StorageFields form={roomForm} />
      
      <StatusField form={roomForm} />
    </div>
  );
}
