import { supabase } from '@/lib/supabase';

export type RoomBulbType = 'led' | 'fluorescent' | 'screw_in' | 'mixed' | 'unknown';
export type RoomCeilingAccess = 'normal' | 'high' | 'hard_to_reach' | 'unknown';

export interface RoomLightingProfile {
  room_id: string;
  bulb_type: RoomBulbType;
  ceiling_access: RoomCeilingAccess;
  led_converted: boolean;
  notes: string | null;
  updated_at: string;
  updated_by: string | null;
  // Joined for display
  room?: {
    room_number: string | null;
    name: string | null;
    floor?: { name: string | null; building?: { id: string; name: string | null } | null } | null;
  } | null;
}

export interface RoomWithProfile {
  id: string;
  room_number: string | null;
  name: string | null;
  floor_id: string | null;
  floor_name: string | null;
  building_id: string | null;
  building_name: string | null;
  profile: {
    bulb_type: RoomBulbType;
    ceiling_access: RoomCeilingAccess;
    led_converted: boolean;
    notes: string | null;
    updated_at: string | null;
  } | null;
}

/**
 * Every room (active, with a room_number) joined with its lighting profile if
 * one exists. Powers the Rooms management table + Coverage rollups.
 */
export async function listRoomsWithLightingProfiles(): Promise<RoomWithProfile[]> {
  const { data: rooms, error: roomsErr } = await supabase
    .from('rooms')
    .select(`
      id,
      room_number,
      name,
      floor_id,
      floor:floors(id, name, building:buildings(id, name))
    `)
    .not('room_number', 'is', null)
    .order('room_number');
  if (roomsErr) throw roomsErr;

  const { data: profiles, error: profilesErr } = await supabase
    .from('room_lighting_profiles')
    .select('room_id, bulb_type, ceiling_access, led_converted, notes, updated_at');
  if (profilesErr) throw profilesErr;

  const profileMap = new Map((profiles || []).map((p: any) => [p.room_id, p]));

  return (rooms || []).map((r: any) => {
    const floor = Array.isArray(r.floor) ? r.floor[0] : r.floor;
    const building = floor ? (Array.isArray(floor.building) ? floor.building[0] : floor.building) : null;
    const profile = profileMap.get(r.id) || null;
    return {
      id: r.id,
      room_number: r.room_number,
      name: r.name,
      floor_id: r.floor_id,
      floor_name: floor?.name ?? null,
      building_id: building?.id ?? null,
      building_name: building?.name ?? null,
      profile,
    } as RoomWithProfile;
  });
}

export interface UpsertProfileInput {
  room_id: string;
  bulb_type?: RoomBulbType;
  ceiling_access?: RoomCeilingAccess;
  led_converted?: boolean;
  notes?: string | null;
}

/** Admin / FC upserts a room's lighting profile. */
export async function upsertRoomLightingProfile(input: UpsertProfileInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('room_lighting_profiles')
    .upsert({
      room_id: input.room_id,
      bulb_type: input.bulb_type ?? 'unknown',
      ceiling_access: input.ceiling_access ?? 'unknown',
      led_converted: input.led_converted ?? false,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    }, { onConflict: 'room_id' });
  if (error) throw error;
}

export interface BuildingCoverage {
  building_id: string | null;
  building_name: string;
  total_rooms_with_profile: number;
  rooms_led: number;
  rooms_other_known: number;
  rooms_unknown_bulb: number;
  total_rooms: number;
  led_percent: number;
}

/**
 * Per-building coverage rollup. Counts rooms with a profile vs. total active
 * rooms in that building, and breaks down by bulb type.
 */
export function computeBuildingCoverage(rooms: RoomWithProfile[]): BuildingCoverage[] {
  const byBuilding = new Map<string, BuildingCoverage>();
  for (const r of rooms) {
    const key = r.building_id ?? 'no-building';
    let row = byBuilding.get(key);
    if (!row) {
      row = {
        building_id: r.building_id,
        building_name: r.building_name ?? 'Unassigned',
        total_rooms_with_profile: 0,
        rooms_led: 0,
        rooms_other_known: 0,
        rooms_unknown_bulb: 0,
        total_rooms: 0,
        led_percent: 0,
      };
      byBuilding.set(key, row);
    }
    row.total_rooms += 1;
    if (r.profile) {
      row.total_rooms_with_profile += 1;
      if (r.profile.led_converted || r.profile.bulb_type === 'led') row.rooms_led += 1;
      else if (r.profile.bulb_type !== 'unknown') row.rooms_other_known += 1;
      else row.rooms_unknown_bulb += 1;
    }
  }
  const result = Array.from(byBuilding.values());
  for (const row of result) {
    row.led_percent = row.total_rooms > 0 ? Math.round((row.rooms_led / row.total_rooms) * 100) : 0;
  }
  return result.sort((a, b) => a.building_name.localeCompare(b.building_name));
}

export interface FloorHeat {
  floor_id: string;
  floor_name: string;
  building_name: string;
  open_count: number;
  resolved_90d_count: number;
  total_90d: number;
}

/**
 * Issue density per floor over the last 90 days — open issues + resolved
 * recent ones. Used to surface trouble spots geographically.
 */
export async function getFloorHeatmap(): Promise<FloorHeat[]> {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('lighting_issues')
    .select(`
      status,
      reported_at,
      room:rooms!inner(
        floor_id,
        floor:floors!inner(id, name, building:buildings(name))
      )
    `)
    .gte('reported_at', since);
  if (error) throw error;

  const byFloor = new Map<string, FloorHeat>();
  for (const row of (data ?? []) as any[]) {
    const room = Array.isArray(row.room) ? row.room[0] : row.room;
    const floor = room?.floor && (Array.isArray(room.floor) ? room.floor[0] : room.floor);
    if (!floor?.id) continue;
    const building = floor.building && (Array.isArray(floor.building) ? floor.building[0] : floor.building);
    let bucket = byFloor.get(floor.id);
    if (!bucket) {
      bucket = {
        floor_id: floor.id,
        floor_name: floor.name ?? 'Unnamed floor',
        building_name: building?.name ?? 'Unassigned',
        open_count: 0,
        resolved_90d_count: 0,
        total_90d: 0,
      };
      byFloor.set(floor.id, bucket);
    }
    bucket.total_90d += 1;
    if (row.status === 'resolved') bucket.resolved_90d_count += 1;
    else bucket.open_count += 1;
  }
  return Array.from(byFloor.values()).sort((a, b) => b.total_90d - a.total_90d);
}
