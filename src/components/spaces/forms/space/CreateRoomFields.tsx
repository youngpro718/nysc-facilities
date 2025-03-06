
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { BasicRoomFields } from "../room/BasicRoomFields";
import { StorageFields } from "../room/StorageFields";
import { StatusField } from "../room/StatusField";

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
    </div>
  );
}
