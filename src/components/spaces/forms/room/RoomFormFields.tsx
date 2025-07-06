import { RoomFormProps } from "./types";
import { BasicRoomFields } from "./BasicRoomFields";
import { StorageFields } from "./StorageFields";
import { StatusField } from "./StatusField";

export function RoomFormFields({ form }: RoomFormProps) {
  const floorId = form.watch("floorId");
  const roomIdValue = form.getValues()?.id || undefined; // Safe access with fallback

  return (
    <div className="space-y-6">
      <BasicRoomFields form={form} />
      <StorageFields form={form} />
      
      <StatusField form={form} />
    </div>
  );
}
