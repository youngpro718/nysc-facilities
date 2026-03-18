import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { LightStatus, LightingFixture } from '@/types/lighting';

export const markLightsOut = async (fixtureIds: string[], requiresElectrician: boolean = false) => {
  const updateData: any = {
    status: 'non_functional' as LightStatus,
    reported_out_date: new Date().toISOString()
  };

  if (requiresElectrician) {
    updateData.requires_electrician = true;
    updateData.electrical_issues = true;
  }

  const { error } = await supabase
    .from('lighting_fixtures')
    .update(updateData)
    .in('id', fixtureIds);

  if (error) throw error;
  return true;
};

export const markLightsFixed = async (fixtureIds: string[]) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({
      status: 'functional' as LightStatus,
      replaced_date: new Date().toISOString(),
      requires_electrician: false,
      electrical_issues: false
    })
    .in('id', fixtureIds);

  if (error) throw error;
  return true;
};

export const toggleElectricianRequired = async (fixtureIds: string[], required: boolean) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({
      requires_electrician: required,
      electrical_issues: required
    })
    .in('id', fixtureIds);

  if (error) throw error;
  return true;
};

export const fetchLightingFixtures = async () => {
  const { data, error } = await supabase
    .from('lighting_fixtures')
    .select(`
      *,
      lighting_zones (
        id,
        name,
        type
      ),
      spatial_assignments (
        id,
        space_id,
        space_type,
        position,
        sequence_number
      )
    `)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw error;

  const fixtures = data || [];

  try {
    if (!fixtures.length) return fixtures;
    const fixtureIds = fixtures.map((f: any) => f.id);

    const { data: assignments, error: assignError } = await supabase
      .from('spatial_assignments')
      .select('fixture_id, space_id, space_type, position, sequence_number')
      .in('fixture_id', fixtureIds);
    if (assignError) throw assignError;

    const assignmentsByFixture = new Map<string, any[]>();
    for (const a of (assignments || [])) {
      const arr = assignmentsByFixture.get(a.fixture_id) || [];
      arr.push(a);
      assignmentsByFixture.set(a.fixture_id, arr);
    }

    const roomIds = new Set<string>();
    const genericSpaceIds = new Set<string>();
    for (const arr of assignmentsByFixture.values()) {
      for (const a of arr) {
        if (!a?.space_id) continue;
        if (a.space_type === 'room') roomIds.add(a.space_id);
        else genericSpaceIds.add(a.space_id);
      }
    }

    const [roomsRes, spacesRes] = await Promise.all([
      roomIds.size
        ? supabase.from('rooms').select('id, name, room_number').in('id', Array.from(roomIds))
        : Promise.resolve({ data: [], error: null } as any),
      genericSpaceIds.size
        ? supabase.from('unified_spaces').select('id, name, room_number, building_name, floor_name').in('id', Array.from(genericSpaceIds))
        : Promise.resolve({ data: [], error: null } as any)
    ]);

    if (roomsRes.error) throw roomsRes.error;
    if (spacesRes.error) throw spacesRes.error;

    const roomsMap = new Map((roomsRes.data as any[]).map((r: any) => [r.id, r]));
    const spaceMap = new Map((spacesRes.data as any[]).map((s: any) => [s.id, s]));

    const enriched = fixtures.map((f: any) => {
      const arr = assignmentsByFixture.get(f.id) || [];
      const sa = arr.find((x: any) => x && x.space_id) || null;
      let sName: string | null = null;
      let rNumber: string | null = null;
      let bName: string | null = null;
      let flName: string | null = null;

      if (sa?.space_type === 'room') {
        const r = sa.space_id ? roomsMap.get(sa.space_id) : null;
        if (r) {
          sName = r.name ?? null;
          rNumber = r.room_number ?? null;
        }
      } else if (sa?.space_id) {
        const s = spaceMap.get(sa.space_id);
        if (s) {
          sName = s.name ?? null;
          rNumber = s.room_number ?? null;
          bName = s.building_name ?? null;
          flName = s.floor_name ?? null;
        }
      }

      return {
        ...f,
        spatial_assignments: arr,
        space_id: f.space_id ?? sa?.space_id ?? null,
        space_type: f.space_type ?? sa?.space_type ?? null,
        space_name: f.space_name ?? sName ?? null,
        room_number: f.room_number ?? rNumber ?? null,
        building_name: f.building_name ?? bName ?? null,
        floor_name: f.floor_name ?? flName ?? null,
        zone_name: f.zone_name ?? (f.lighting_zones ? (f.lighting_zones as any).name : null),
      };
    });

    return enriched;
  } catch (error) {
    logger.warn('Lighting fixtures enrichment failed:', error);
  }

  return fixtures;
};

export const fetchRoomLightingStats = async () => {
  const { data, error } = await supabase
    .from('unified_spaces')
    .select(`
      id,
      name,
      room_number,
      lighting_fixtures (
        id,
        status,
        electrical_issues,
        ballast_issue
      )
    `)
    .limit(500);

  if (error) throw error;
  return data || [];
};

export const fetchRoomWithLightingFixtures = async (
  roomId: string
): Promise<{ id: string; name: string; room_number: string | null; lighting_fixtures: Array<{ id: string; status: any; bulb_count: number }> } | null> => {
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('id, name, room_number')
    .eq('id', roomId)
    .maybeSingle();
  if (roomErr) throw roomErr;
  if (!room) return null;

  const { data: assignments, error: assignErr } = await supabase
    .from('spatial_assignments')
    .select('fixture_id')
    .eq('space_id', roomId)
    .eq('space_type', 'room');
  if (assignErr) throw assignErr;

  const fixtureIds = Array.from(new Set((assignments || []).map((a: any) => a.fixture_id))).filter(Boolean) as string[];

  let fixtures: Array<{ id: string; status: any; bulb_count: number }> = [];
  if (fixtureIds.length) {
    const { data: fx, error: fxErr } = await supabase
      .from('lighting_fixtures')
      .select('id, status, bulb_count')
      .in('id', fixtureIds);
    if (fxErr) throw fxErr;
    fixtures = (fx || []) as Array<{ id: string; status: any; bulb_count: number }>;
  }

  return {
    id: room.id,
    name: room.name,
    room_number: room.room_number ?? null,
    lighting_fixtures: fixtures,
  };
};

export const fetchSiblingFixturesForFixture = async (
  fixtureId: string
): Promise<Array<Pick<LightingFixture, 'id' | 'technology' | 'status' | 'requires_electrician'>>> => {
  const { data: ownAssn, error: ownAssnErr } = await supabase
    .from('spatial_assignments')
    .select('space_id')
    .eq('fixture_id', fixtureId)
    .limit(1);
  if (ownAssnErr) throw ownAssnErr;
  const spaceId = ownAssn?.[0]?.space_id as string | null | undefined;
  if (!spaceId) return [];

  const { data: assignments, error: assignError } = await supabase
    .from('spatial_assignments')
    .select('fixture_id, sequence_number')
    .eq('space_id', spaceId);
  if (assignError) throw assignError;

  const fixtureIds = Array.from(new Set((assignments || []).map((a: any) => a.fixture_id)));
  const seqMap = new Map<string, number | null>(
    (assignments || []).map((a: any) => [a.fixture_id, a.sequence_number ?? null])
  );
  if (!fixtureIds.length) return [];

  const { data, error } = await supabase
    .from('lighting_fixtures')
    .select('id, technology, status, requires_electrician')
    .in('id', fixtureIds);
  if (error) throw error;

  const sorted = (data || []).slice().sort((a: any, b: any) => {
    const sa = seqMap.get(a.id);
    const sb = seqMap.get(b.id);
    const va = sa == null ? Number.NEGATIVE_INFINITY : Number(sa);
    const vb = sb == null ? Number.NEGATIVE_INFINITY : Number(sb);
    return va - vb;
  });

  return sorted as Array<Pick<LightingFixture, 'id' | 'technology' | 'status' | 'requires_electrician'>>;
};

export const deleteLightingFixture = async (id: string) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const deleteLightingFixtures = async (fixtureIds: string[]) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .delete()
    .in('id', fixtureIds);

  if (error) throw error;
  return true;
};

export const updateLightingFixturesStatus = async (fixtureIds: string[], status: LightStatus) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ status })
    .in('id', fixtureIds);

  if (error) throw error;
  return true;
};

export const createLightingFixture = async (fixtureData: any) => {
  const { data, error } = await supabase
    .from('lighting_fixtures')
    .insert(fixtureData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createLightingZone = async (zoneData: any) => {
  const { data, error } = await supabase
    .from('lighting_zones')
    .insert(zoneData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchLightingZones = async () => {
  const { data, error } = await supabase
    .from('lighting_zones')
    .select('*')
    .order('name')
    .limit(500);

  if (error) throw error;
  return data || [];
};

export const fetchFloorsForZones = async () => {
  const { data, error } = await supabase
    .from('floors')
    .select('id, name, floor_number')
    .order('floor_number');

  if (error) throw error;
  return data || [];
};
