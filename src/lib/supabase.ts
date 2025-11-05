// IMPORTANT: This is the ONLY file that should import directly from integrations
// All other files should import from '@/lib/supabase'

// Direct import from the actual supabase client - avoiding circular imports
import { createClient } from '@supabase/supabase-js';
// Types will be inferred from createClient

// Load Supabase credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate that required environment variables are present
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing required Supabase environment variables. ' +
    'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'app-auth',
    storage: localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const supabaseWithRetry = {
  async query<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error: any) {
        lastError = error;
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('ERR_CONNECTION_CLOSED') ||
            error?.message?.includes('Network Error')) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
    throw lastError;
  }
};

// Export the supabase client type for use in other files
export type SupabaseClient = typeof supabase;

// Supply request service functions (implemented directly with supabase client)
export const submitSupplyRequest = async (requestData: any) => {
  const { data, error } = await supabase.from('supply_requests').insert(requestData).select().single();
  if (error) throw error;
  return data;
};

export const getSupplyRequests = async (userId?: string) => {
  let query = supabase
    .from('supply_requests')
    .select(`
      *,
      profiles!requester_id (
        first_name,
        last_name,
        email,
        department
      ),
      supply_request_items (
        *,
        inventory_items (
          name,
          unit,
          quantity,
          category_id,
          inventory_categories (
            name,
            color
          )
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('requester_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateSupplyRequestStatus = async (id: string, status: string) => {
  const { error } = await supabase.from('supply_requests').update({ status }).eq('id', id);
  if (error) throw error;
};

export const updateSupplyRequestItems = async (id: string, items: any[]) => {
  const { error } = await supabase.from('supply_requests').update({ items }).eq('id', id);
  if (error) throw error;
};

export const startSupplyRequestWork = async (id: string) => {
  const { error } = await supabase.from('supply_requests').update({ 
    work_started_at: new Date().toISOString(),
    status: 'in_progress'
  }).eq('id', id);
  if (error) throw error;
};

export const completeSupplyRequestWork = async (id: string, notes?: string) => {
  const { error } = await supabase.from('supply_requests').update({ 
    work_completed_at: new Date().toISOString(),
    status: 'completed',
    completion_notes: notes
  }).eq('id', id);
  if (error) throw error;
};

export const getFulfillmentLog = async (requestId: string) => {
  const { data, error } = await supabase.from('fulfillment_logs').select('*').eq('request_id', requestId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getInventoryItems = async () => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, inventory_categories(id, name)')
    .order('name');
  if (error) throw error;
  return data;
};

// Auth service functions
export const authService = {
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },
  signUp: async (email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
  },
  signOut: async () => {
    return supabase.auth.signOut();
  },
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  signUpWithEmail: async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: userData
      }
    });
    if (error) throw error;
    return data;
  },
  fetchUserProfile: async (userId: string) => {
    const startTime = Date.now();
    console.log('[authService.fetchUserProfile] Starting parallel fetch for user:', userId);
    
    // OPTIMIZATION: Fetch user roles and profile in parallel instead of sequentially
    const [rolesResult, profileResult] = await Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select(`
          *,
          departments(name)
        `)
        .eq('id', userId)
        .maybeSingle()
    ]);

    if (rolesResult.error) {
      console.error('[authService.fetchUserProfile] Error fetching user roles:', rolesResult.error);
    }

    if (profileResult.error) {
      console.error('[authService.fetchUserProfile] Error fetching profile:', profileResult.error);
    }

    const role = rolesResult.data?.role || 'standard';
    const isAdmin = role === 'admin';
    const profile = profileResult.data ? { ...profileResult.data, role } : null;

    const elapsed = Date.now() - startTime;
    console.log(`[authService.fetchUserProfile] Completed in ${elapsed}ms - role: ${role}, isAdmin: ${isAdmin}, profile: ${!!profile}`);

    return { isAdmin, profile };
  },
  updateSessionTracking: async (userId: string, deviceInfo: any) => {
    // OPTIMIZATION: Use upsert for single round-trip instead of select-then-update/insert
    try {
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: userId,
          device_info: deviceInfo,
          last_active_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error('[authService.updateSessionTracking] Error:', error);
      }
    } catch (error) {
      console.error('[authService.updateSessionTracking] Exception:', error);
    }
  },
  deleteUserSession: async (userId: string) => {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting user session:', error);
    }
  }
};

import type { LightStatus, LightingFixture } from '@/types/lighting';

// Export lighting service functions for compatibility  
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
    .order('created_at', { ascending: false });

  if (error) throw error;

  const fixtures = data || [];

  // Enrich fixtures with location info by explicitly fetching spatial_assignments and joining to rooms/unified_spaces
  try {
    if (!fixtures.length) return fixtures;
    const fixtureIds = fixtures.map((f: any) => f.id);

    // 1) Fetch spatial assignments by fixture ids (avoids relying on FK relationship in nested select)
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

    // 2) Collect room ids and generic space ids
    const roomIds = new Set<string>();
    const genericSpaceIds = new Set<string>();
    for (const arr of assignmentsByFixture.values()) {
      for (const a of arr) {
        if (!a?.space_id) continue;
        if (a.space_type === 'room') roomIds.add(a.space_id);
        else genericSpaceIds.add(a.space_id);
      }
    }

    // 3) Fetch rooms and (optionally) unified_spaces for non-room types
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

    // 4) Merge onto fixtures
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
  } catch (e) {
    console.warn('Lighting fixtures enrichment failed:', e);
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
    `);
  
  if (error) throw error;
  return data || [];
};

// Explicitly fetch a room and its lighting fixtures without using reverse relationship shorthand.
// Resolves fixture IDs via spatial_assignments where space_type='room' and space_id=roomId,
// then loads minimal fixture fields required by UI calculators.
export const fetchRoomWithLightingFixtures = async (
  roomId: string
): Promise<{ id: string; name: string; room_number: string | null; lighting_fixtures: Array<{ id: string; status: any; bulb_count: number }> } | null> => {
  // Fetch basic room info
  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select('id, name, room_number')
    .eq('id', roomId)
    .maybeSingle();
  if (roomErr) throw roomErr;
  if (!room) return null;

  // Resolve fixture IDs via spatial assignments
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

// Fetch sibling fixtures for a given fixture by resolving its space via spatial_assignments.
// Avoids relying on lighting_fixtures.space_id and sorts by spatial_assignments.sequence_number (nulls first).
export const fetchSiblingFixturesForFixture = async (
  fixtureId: string
): Promise<Array<Pick<LightingFixture, 'id' | 'technology' | 'status' | 'requires_electrician'>>> => {
  // 1) Resolve space_id for this fixture
  const { data: ownAssn, error: ownAssnErr } = await supabase
    .from('spatial_assignments')
    .select('space_id')
    .eq('fixture_id', fixtureId)
    .limit(1);
  if (ownAssnErr) throw ownAssnErr;
  const spaceId = ownAssn?.[0]?.space_id as string | null | undefined;
  if (!spaceId) return [];

  // 2) Fetch all assignments in the same space and build sequence map
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

  // 3) Fetch minimal fields for sibling fixtures
  const { data, error } = await supabase
    .from('lighting_fixtures')
    .select('id, technology, status, requires_electrician')
    .in('id', fixtureIds);
  if (error) throw error;

  // 4) Sort by sequence_number (nulls first)
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
    .order('name');
  
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