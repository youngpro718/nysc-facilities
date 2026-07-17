import { RoomTypeEnum } from "./roomEnums";

/**
 * The full, curated list of room types selectable in the create/edit
 * pickers. Older DB enum values not on this list (chamber, break_room,
 * filing_room, laboratory, conference) stay valid for any legacy rooms still
 * carrying them, but are no longer offered as choices.
 */
export const VISIBLE_ROOM_TYPES: RoomTypeEnum[] = [
  RoomTypeEnum.COURTROOM,
  RoomTypeEnum.JUDGES_CHAMBERS,
  RoomTypeEnum.JURY_ROOM,
  RoomTypeEnum.WITNESS_ROOM,
  RoomTypeEnum.OFFICE,
  RoomTypeEnum.CONFERENCE_ROOM,
  RoomTypeEnum.RECORDS_ROOM,
  RoomTypeEnum.UTILITY_ROOM,
  RoomTypeEnum.IT_ROOM,
  RoomTypeEnum.MALE_LOCKER_ROOM,
  RoomTypeEnum.FEMALE_LOCKER_ROOM,
  RoomTypeEnum.ROBING_ROOM,
  RoomTypeEnum.STAKE_HOLDER,
  RoomTypeEnum.ADMINISTRATIVE_OFFICE,
  RoomTypeEnum.BATHROOM,
  RoomTypeEnum.CLOSET,
  RoomTypeEnum.ELECTRICAL_ROOM,
  RoomTypeEnum.SHARED_VESTIBULE,
  RoomTypeEnum.EGRESS,
];

export const ADVANCED_ROOM_TYPES: RoomTypeEnum[] = Object.values(RoomTypeEnum).filter(
  (t) => !VISIBLE_ROOM_TYPES.includes(t),
);

export function formatRoomTypeLabel(type: RoomTypeEnum | string): string {
  return String(type)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
