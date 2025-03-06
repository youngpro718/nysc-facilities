
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { BasicRoomFields } from "../room/BasicRoomFields";
import { StorageFields } from "../room/StorageFields";
import { StatusField } from "../room/StatusField";
import { ConnectionsField } from "../room/ConnectionsField";
import { RoomFormData } from "../room/RoomFormSchema";
import { CreateRoomFieldsProps } from "../room/types";

export function CreateRoomFields({ form, floorId }: CreateRoomFieldsProps) {
  // Convert the form type explicitly
  const roomForm = form as unknown as UseFormReturn<RoomFormData>;
  
  return (
    <div className="space-y-4">
      <BasicRoomFields form={roomForm} />
      <StorageFields form={roomForm} />
      <StatusField form={roomForm} />
      
      {/* Only add ConnectionsField when creating a room with a selected floor */}
      {floorId && (
        <ConnectionsField 
          form={roomForm}
          floorId={floorId} 
        />
      )}
    </div>
  );
}
