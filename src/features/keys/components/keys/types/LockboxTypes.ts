export interface Lockbox {
  id: string;
  name: string;
  location_description?: string;
  notes?: string;
  created_at: string;
}

export type LockboxSlotStatus = 'in_box' | 'checked_out' | 'missing' | 'retired';

export type LockboxSlotKeyRole =
  | 'main_door'
  | 'top_lock'
  | 'bottom_lock'
  | 'sub_room'
  | 'other';

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
  key_role?: LockboxSlotKeyRole | null;
  sub_room_label?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  room?: {
    id: string;
    room_number: string;
    name?: string;
    floors?: JoinedFloor | JoinedFloor[] | null;
  };
}

// PostgREST returns to-one embeds as objects, but older supabase-js typings
// (and some query shapes) surface them as single-element arrays — accept both.
type JoinedBuilding = { name?: string | null };
type JoinedFloor = {
  name?: string | null;
  buildings?: JoinedBuilding | JoinedBuilding[] | null;
};

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

/** Compare ignoring case, whitespace, and punctuation ("1614 / A" ≡ "1614A"). */
function normalizeForCompare(s: string): string {
  return s.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/**
 * Remove the room number (and the punctuation joining it) from a stored
 * label, leaving just the human descriptor:
 *   "1702 JUDGE CARRO CHAMBERS" → "JUDGE CARRO CHAMBERS"
 *   "Hon. Hanshaft 568"         → "Hon. Hanshaft"
 *   "1704- Project Director"    → "Project Director"
 */
function stripRoomNumberFromLabel(
  label: string,
  roomNumbers: Array<string | null | undefined>,
): string {
  let out = label;
  for (const rn of roomNumbers) {
    const trimmed = rn?.trim();
    if (!trimmed) continue;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(
      new RegExp(`(^|[\\s\\-–—/:,])${escaped}(?=$|[\\s\\-–—/:,])`, "gi"),
      "$1",
    );
  }
  return out
    .replace(/^[\s\-–—/:,]+/, "")
    .replace(/[\s\-–—/:,]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Minimal title for tight lists (mobile rows): room number first, then only
 * the descriptor that distinguishes this key — never the official room name
 * or building, which belong in the detail view.
 *
 *   "1416 · Back Office", "568 · Hon. Hanshaft", "948"
 */
export function getSlotCompactTitle(slot: LockboxSlot): string {
  const roomNumber =
    slot.room?.room_number?.trim() || slot.room_number?.trim() || "";
  const label = slot.label?.trim() || "";

  const parts: string[] = [];
  if (label && (!roomNumber || normalizeForCompare(label) !== normalizeForCompare(roomNumber))) {
    const descriptor = roomNumber
      ? stripRoomNumberFromLabel(label, [roomNumber, slot.room_number])
      : label;
    if (descriptor && normalizeForCompare(descriptor) !== normalizeForCompare(roomNumber)) {
      parts.push(descriptor);
    }
  }
  const role = getKeyRoleLabel(slot.key_role, slot.sub_room_label);
  if (role && !parts.some((p) => normalizeForCompare(p) === normalizeForCompare(role))) {
    parts.push(role);
  }

  const descriptor = parts.join(" · ");
  if (roomNumber && descriptor) return `${roomNumber} · ${descriptor}`;
  if (roomNumber) return roomNumber;
  return descriptor || label || `Slot ${slot.slot_number}`;
}

/**
 * "Where is this room?" — building and floor from the joined room, for the
 * slot detail view. Null when the slot's query didn't join that far.
 */
export function getSlotBuildingLocation(slot: LockboxSlot): string | null {
  const floors = slot.room?.floors;
  const floor = Array.isArray(floors) ? floors[0] : floors;
  if (!floor) return null;
  const buildings = floor.buildings;
  const building = Array.isArray(buildings) ? buildings[0] : buildings;
  const parts = [building?.name?.trim(), floor.name?.trim()].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Short human-readable label for a key role, suitable for chips/badges. */
export function getKeyRoleLabel(role?: LockboxSlotKeyRole | null, subRoomLabel?: string | null): string | null {
  switch (role) {
    case 'main_door': return 'Main Door';
    case 'top_lock': return 'Top Lock';
    case 'bottom_lock': return 'Bottom Lock';
    case 'sub_room': return subRoomLabel?.trim() ? `Sub-Room: ${subRoomLabel.trim()}` : 'Sub-Room';
    case 'other': return 'Other';
    default: return null;
  }
}

/** Tailwind classes for the role chip — keeps each role visually distinct. */
export function getKeyRoleChipClasses(role?: LockboxSlotKeyRole | null): string {
  switch (role) {
    case 'top_lock':
    case 'bottom_lock':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    case 'sub_room':
      return 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800';
    case 'main_door':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
    case 'other':
      return 'bg-muted text-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

