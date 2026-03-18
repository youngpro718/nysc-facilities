
import { ConnectionsContainer } from "./connections/ConnectionsContainer";
import { RoomFormProps } from "./types";

export function ConnectionsField({ form, floorId, roomId }: RoomFormProps & { floorId: string; roomId?: string }) {
  return <ConnectionsContainer form={form} floorId={floorId} roomId={roomId} />;
}
