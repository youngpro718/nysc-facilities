
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { BasicRoomFields } from "../room/BasicRoomFields";
import { StorageFields } from "../room/StorageFields";
import { ParentRoomField } from "../room/ParentRoomField";
import { RoomFormData } from "../room/RoomFormSchema";
import { CreateRoomFieldsProps } from "../room/types";

export function CreateRoomFields({ form, floorId }: CreateRoomFieldsProps) {
  // Convert the form type explicitly
  const roomForm = form as unknown as UseFormReturn<RoomFormData>;

  return (
    <div className="space-y-4">
      <BasicRoomFields form={roomForm} />
      
      <ParentRoomField form={roomForm} floorId={floorId} />
      
      <StorageFields form={roomForm} />
    </div>
  );
}
