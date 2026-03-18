import { RoomFormProps } from "./types";
import { BasicRoomFields } from "./BasicRoomFields";
import { FunctionFields } from "./FunctionFields";
import { StorageFields } from "./StorageFields";
import { StatusField } from "./StatusField";
import { ParentRoomField } from "./ParentRoomField";
import { CourtroomFields } from "./CourtroomFields";
import { RoomLightingFields } from "./RoomLightingFields";

export function RoomFormFields({ form }: RoomFormProps) {
  const floorId = form.watch("floorId");
  const roomIdValue = form.getValues()?.id || undefined; // Safe access with fallback

  return (
    <div className="space-y-6">
      <BasicRoomFields form={form} />
      
      <FunctionFields form={form} />
      
      <ParentRoomField form={form} floorId={floorId} currentRoomId={roomIdValue} />
      
      <StorageFields form={form} />
      
      <CourtroomFields form={form} />
      
      <RoomLightingFields form={form} />
      
      <StatusField form={form} />
    </div>
  );
}
