
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { BasicRoomFields } from "../room/BasicRoomFields";
import { StorageFields } from "../room/StorageFields";
import { RoomFormData } from "../room/RoomFormSchema";
import { CreateRoomFieldsProps } from "../room/types";

export function CreateRoomFields({ form, floorId }: CreateRoomFieldsProps) {
  // Convert the form type explicitly
  const roomForm = form as unknown as UseFormReturn<RoomFormData>;
  const rawRoomType = roomForm.watch('roomType');
  const roomType = typeof rawRoomType === 'string' ? rawRoomType : String(rawRoomType ?? '');
  // parent room field removed, so flag no longer needed

  return (
    <div className="space-y-4">
      <BasicRoomFields form={roomForm} />
      
      <StorageFields form={roomForm} />
    </div>
  );
}
