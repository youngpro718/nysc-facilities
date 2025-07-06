import { RoomFormProps } from "./types";
import { BasicRoomFields } from "./BasicRoomFields";
import { StorageFields } from "./StorageFields";
import { StatusField } from "./StatusField";
import { ParentRoomField } from "./ParentRoomField";

export function RoomFormFields({ form }: RoomFormProps) {
  const floorId = form.watch("floorId");
  const roomIdValue = form.getValues()?.id || undefined; // Safe access with fallback

  return (
    <div className="space-y-6">
      <BasicRoomFields form={form} />
      
      <ParentRoomField form={form} floorId={floorId} currentRoomId={roomIdValue} />
      
      <StorageFields form={form} />
      
      <StatusField form={form} />
    </div>
  );
}
