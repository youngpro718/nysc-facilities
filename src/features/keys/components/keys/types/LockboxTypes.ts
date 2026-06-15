export interface Lockbox {
  id: string;
  name: string;
  location_description?: string;
  notes?: string;
  created_at: string;
}

export type LockboxSlotStatus = 'in_box' | 'checked_out' | 'missing' | 'retired';

export interface LockboxSlot {
  id: string;
  lockbox_id: string;
  slot_number: number;
  label: string;
  room_number?: string;
  room_id?: string; // New: foreign key to rooms table
  key_id?: string;
  status: LockboxSlotStatus;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Joined data
  room?: {
    id: string;
    room_number: string;
    name?: string;
  };
}

export interface LockboxActivityLog {
  id: string;
  slot_id: string;
  action: 'check_out' | 'check_in' | 'status_change' | 'edit_details' | 'audit_note';
  status_before?: string;
  status_after?: string;
  actor_user_id?: string;
  actor_name?: string;
  note?: string;
  created_at: string;
}

export interface LockboxWithSlotCount extends Lockbox {
  total_slots: number;
  available_slots: number;
  checked_out_slots: number;
}

export interface LockboxSlotWithLockbox extends LockboxSlot {
  lockbox_name?: string;
  lockbox_location?: string;
}

// Room link status for visual indicators
export type RoomLinkStatus = 'linked' | 'unlinked' | 'no_room';

export function getRoomLinkStatus(slot: LockboxSlot): RoomLinkStatus {
  if (slot.room_id) {
    return 'linked';
  }
  if (slot.room_number && !slot.room_id) {
    return 'unlinked';
  }
  return 'no_room';
}

/**
 * Resolve the user-facing title for a slot.
 *
 * Rule: when a slot is linked to a room, the live room identity ALWAYS wins
 * over the manually-stored `slot.label` — the label can go stale when a judge
 * or occupant moves, and staff pulling keys from the box need the current
 * truth from Spaces, not whatever someone typed when the slot was created.
 *
 * - Linked room (joined data present): "Room {room_number} — {name}"
 * - Linked room (only room_number, room row missing/deleted): falls back to
 *   stale "Room {room_number}" so we never silently drop the link.
 * - No room at all: shows the stored label as before.
 */
export function getSlotDisplayTitle(slot: LockboxSlot): string {
  if (slot.room) {
    const num = slot.room.room_number;
    const name = slot.room.name?.trim();
    if (num && name) return `Room ${num} — ${name}`;
    if (num) return `Room ${num}`;
    if (name) return name;
  }
  if (slot.room_number) {
    return `Room ${slot.room_number}`;
  }
  return slot.label;
}

/** True when the slot is linked to a room and the room title is authoritative. */
export function slotHasRoomLink(slot: LockboxSlot): boolean {
  return Boolean(slot.room_id || slot.room_number);
}
