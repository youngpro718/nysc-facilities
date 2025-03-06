
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { BasicRoomFields } from "../room/BasicRoomFields";
import { StorageFields } from "../room/StorageFields";
import { StatusField } from "../room/StatusField";
import { ConnectionsField } from "../room/ConnectionsField";
import { RoomFormData } from "../room/RoomFormSchema";

interface CreateRoomFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function CreateRoomFields({ form, floorId }: CreateRoomFieldsProps) {
  return (
    <div className="space-y-4">
      <BasicRoomFields form={form as unknown as UseFormReturn<RoomFormData>} />
      <StorageFields form={form as unknown as UseFormReturn<RoomFormData>} />
      <StatusField form={form as unknown as UseFormReturn<RoomFormData>} />
      
      {/* Only add ConnectionsField when creating a room with a selected floor */}
      {floorId && (
        <ConnectionsField 
          form={form as unknown as UseFormReturn<RoomFormData>} 
          floorId={floorId} 
        />
      )}
    </div>
  );
}
