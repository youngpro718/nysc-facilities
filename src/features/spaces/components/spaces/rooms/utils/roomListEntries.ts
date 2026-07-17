import type { Room } from "../types/RoomTypes";
import type { CommonArea } from "../../common-areas/types";

/**
 * A room list can also surface common areas (hallways, lobbies, etc. — a
 * different table from rooms) inline, e.g. when the water-cooler filter is
 * active. This union keeps the two entity kinds distinguishable so list rows
 * can style common areas differently (orange) and route clicks correctly.
 */
export type RoomListEntry =
  | { kind: "room"; room: Room }
  | { kind: "common_area"; area: CommonArea };

const roomLabel = (room: Room) => room.room_number || room.name || "";

/**
 * Insert common areas into an already-sorted room list, keeping the rooms'
 * existing order (whatever sort the page applied) and slotting each area in
 * by name using the same numeric-aware collation the room sorts use. Areas
 * that sort past every room are appended.
 */
export function mergeRoomsAndCommonAreas(
  rooms: Room[],
  areas: CommonArea[],
): RoomListEntry[] {
  const entries: RoomListEntry[] = rooms.map((room) => ({ kind: "room", room }));
  const sortedAreas = [...areas].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true }),
  );

  for (const area of sortedAreas) {
    const index = entries.findIndex(
      (entry) =>
        entry.kind === "room" &&
        roomLabel(entry.room).localeCompare(area.name, undefined, { numeric: true }) > 0,
    );
    const entry: RoomListEntry = { kind: "common_area", area };
    if (index === -1) entries.push(entry);
    else entries.splice(index, 0, entry);
  }

  return entries;
}
