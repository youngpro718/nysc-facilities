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
  key_id?: string;
  status: LockboxSlotStatus;
  created_at: string;
  updated_at: string;
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
