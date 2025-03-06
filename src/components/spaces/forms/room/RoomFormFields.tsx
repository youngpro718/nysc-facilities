
import { RoomFormProps } from "./types";
import { BasicRoomFields } from "./BasicRoomFields";
import { ParentRoomField } from "./ParentRoomField";
import { StorageFields } from "./StorageFields";
import { StatusField } from "./StatusField";
import { ConnectionsField } from "./ConnectionsField";

export function RoomFormFields({ form }: RoomFormProps) {
  const currentRoomId = form.getValues("id");
  const floorId = form.watch("floorId");

  return (
    <div className="space-y-6">
      <BasicRoomFields form={form} />
      
      <ParentRoomField 
        form={form} 
        floorId={floorId} 
        currentRoomId={currentRoomId} 
      />
      
      <StorageFields form={form} />
      
      {floorId && (
        <ConnectionsField
          form={form}
          floorId={floorId}
          roomId={currentRoomId}
        />
      )}
      
      <StatusField form={form} />
    </div>
  );
}
