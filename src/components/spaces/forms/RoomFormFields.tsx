
import { UseFormReturn } from "react-hook-form";
import { EditSpaceFormData } from "../schemas/editSpaceSchema";
import { BasicRoomFields } from "./room/BasicRoomFields";
import { ParentRoomField } from "./room/ParentRoomField";
import { StorageFields } from "./room/StorageFields";
import { StatusField } from "./room/StatusField";

// Create a type predicate to narrow the form type
function isRoomForm(form: any): form is UseFormReturn<Extract<EditSpaceFormData, { type: "room" }>> {
  return form.getValues("type") === "room";
}

interface RoomFormFieldsProps {
  form: UseFormReturn<EditSpaceFormData>;
  floorId: string;
}

export function RoomFormFields({ form, floorId }: RoomFormFieldsProps) {
  if (!isRoomForm(form)) {
    throw new Error("Form must be a room form");
  }

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
