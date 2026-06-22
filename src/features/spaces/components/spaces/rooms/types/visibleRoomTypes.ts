import { RoomTypeEnum } from "./roomEnums";

/**
 * Room types shown by default in the create/edit pickers. Other types in the
 * DB enum (chamber, robing_room, locker_rooms, stake_holder,
 * administrative_office, laboratory, conference) stay valid for legacy rooms
 * but are hidden unless the user opts into the advanced list.
 */
export const VISIBLE_ROOM_TYPES: RoomTypeEnum[] = [
  RoomTypeEnum.COURTROOM,
  RoomTypeEnum.JUDGES_CHAMBERS,
  RoomTypeEnum.JURY_ROOM,
  RoomTypeEnum.OFFICE,
  RoomTypeEnum.CONFERENCE_ROOM,
  RoomTypeEnum.BREAK_ROOM,
  RoomTypeEnum.FILING_ROOM,
  RoomTypeEnum.RECORDS_ROOM,
  RoomTypeEnum.UTILITY_ROOM,
  RoomTypeEnum.IT_ROOM,
];

export const ADVANCED_ROOM_TYPES: RoomTypeEnum[] = Object.values(RoomTypeEnum).filter(
  (t) => !VISIBLE_ROOM_TYPES.includes(t),
);

export function formatRoomTypeLabel(type: RoomTypeEnum | string): string {
  return String(type)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
