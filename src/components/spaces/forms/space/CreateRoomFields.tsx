
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { BasicRoomFields } from "../room/BasicRoomFields";
import { StorageFields } from "../room/StorageFields";
import { StatusField } from "../room/StatusField";
import { ConnectionsField } from "../room/ConnectionsField";

interface CreateRoomFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function CreateRoomFields({ form, floorId }: CreateRoomFieldsProps) {
  return (
    <div className="space-y-4">
      <BasicRoomFields form={form as any} />
      <StorageFields form={form as any} />
      <StatusField form={form as any} />
      
      {/* Only add ConnectionsField when creating a room with a selected floor */}
      {floorId && (
        <ConnectionsField 
          form={form as any} 
          floorId={floorId} 
        />
      )}
    </div>
  );
}
