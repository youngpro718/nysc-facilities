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
