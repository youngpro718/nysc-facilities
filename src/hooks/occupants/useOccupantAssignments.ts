import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DetailedRoomAssignment {
  id: string;
  room_id: string;
  room_name: string;
  room_number: string;
  building_id: string;
  building_name: string;
  floor_id: string;
  floor_name: string;
  assignment_type: string;
  is_primary: boolean;
  assigned_at: string;
  schedule?: string;
  notes?: string;
  is_storage?: boolean;
  storage_type?: string;
  storage_capacity?: number;
}

export interface DetailedKeyAssignment {
  id: string;
  key_id: string;
  key_name: string;
  key_type: string;
  assigned_at: string;
  is_spare: boolean;
  room_id?: string;
  room_name?: string;
  room_number?: string;
  building_name?: string;
}

export interface OccupantAssignments {
  roomAssignments: DetailedRoomAssignment[];
  keyAssignments: DetailedKeyAssignment[];
  primaryRoom?: DetailedRoomAssignment;
  storageAssignments: DetailedRoomAssignment[];
}

const ROOM_ASSIGNMENT_SELECT = `
  id,
  room_id,
  assignment_type,
  is_primary,
  assigned_at,
  schedule,
  notes,
  rooms!occupant_room_assignments_room_id_fkey (
    id,
    name,
    room_number,
    floor_id,
    is_storage,
    storage_type,
    storage_capacity,
    floors!rooms_floor_id_fkey (
      id,
      name,
      building_id,
      buildings!floors_building_id_fkey (
        id,
        name
      )
    )
  )
`;

const KEY_ASSIGNMENT_SELECT = `
  id,
  key_id,
  assigned_at,
  is_spare,
  keys!key_assignments_key_id_fkey (
    id,
    name,
    type
  )
`;

/**
 * Format raw room assignments into detailed format
 */
function formatRoomAssignments(rawAssignments: any[]): DetailedRoomAssignment[] {
  return (rawAssignments || []).map((assignment: any) => ({
    id: assignment.id,
    room_id: assignment.room_id,
    room_name: assignment.rooms?.name || 'Unknown Room',
    room_number: assignment.rooms?.room_number || 'N/A',
    building_id: assignment.rooms?.floors?.building_id || '',
    building_name: assignment.rooms?.floors?.buildings?.name || 'Unknown Building',
    floor_id: assignment.rooms?.floor_id || '',
    floor_name: assignment.rooms?.floors?.name || 'Unknown Floor',
    assignment_type: assignment.assignment_type || 'standard',
    is_primary: assignment.is_primary || false,
    assigned_at: assignment.assigned_at,
    schedule: typeof assignment.schedule === 'string' ? assignment.schedule : '',
    notes: assignment.notes || '',
    is_storage: assignment.rooms?.is_storage || false,
    storage_type: assignment.rooms?.storage_type || undefined,
    storage_capacity: assignment.rooms?.storage_capacity || undefined
  }));
}

/**
 * Format raw key assignments into detailed format
 */
function formatKeyAssignments(rawAssignments: any[]): DetailedKeyAssignment[] {
  return (rawAssignments || []).map((assignment: any) => ({
    id: assignment.id,
    key_id: assignment.key_id,
    key_name: assignment.keys?.name || 'Unknown Key',
    key_type: assignment.keys?.type || 'standard',
    assigned_at: assignment.assigned_at,
    is_spare: assignment.is_spare || false,
    room_id: undefined,
    room_name: undefined,
    room_number: undefined,
    building_name: undefined
  }));
}

/**
 * Build result object from formatted assignments
 */
function buildResult(
  roomAssignments: DetailedRoomAssignment[],
  keyAssignments: DetailedKeyAssignment[]
): OccupantAssignments {
  // Find primary room - prioritize is_primary boolean, then primary_office type, else first
  const primaryRoom = roomAssignments.find(room => room.is_primary) 
    || roomAssignments.find(room => room.assignment_type === 'primary_office')
    || roomAssignments[0];
  
  // Separate storage room assignments
  const storageAssignments = roomAssignments.filter(room => room.is_storage);

  return {
    roomAssignments,
    keyAssignments,
    primaryRoom,
    storageAssignments
  };
}

/**
 * Legacy fallback: Resolves the occupant ID for a given auth user ID.
 * Strategy:
 * 1. Try to find occupant by direct ID match (occupants.id = authUserId)
 * 2. If not found, get user's email from profiles and match by email
 */
async function resolveOccupantId(authUserId: string): Promise<string | null> {
  console.log('[useOccupantAssignments] Legacy fallback: Resolving occupant for authUserId:', authUserId);
  
  // First try: direct ID match
  const { data: directMatch, error: directError } = await supabase
    .from('occupants')
    .select('id')
    .eq('id', authUserId)
    .maybeSingle();

  if (directError) {
    console.log('[useOccupantAssignments] Direct match query error:', directError);
  }

  if (directMatch?.id) {
    console.log('[useOccupantAssignments] Found occupant by direct ID match:', directMatch.id);
    return directMatch.id;
  }

  // Second try: match by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', authUserId)
    .maybeSingle();

  if (profileError) {
    console.log('[useOccupantAssignments] Profile query error:', profileError);
  }

  if (!profile?.email) {
    console.log('[useOccupantAssignments] No email found in profiles for user:', authUserId);
    return null;
  }

  const normalizedEmail = profile.email.trim().toLowerCase();

  const { data: emailMatch, error: emailError } = await supabase
    .from('occupants')
    .select('id, email')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (emailError) {
    console.log('[useOccupantAssignments] Email match query error:', emailError);
  }

  if (emailMatch?.id) {
    console.log('[useOccupantAssignments] Found occupant by email match:', emailMatch.id);
    return emailMatch.id;
  }

  return null;
}

export const useOccupantAssignments = (authUserId: string) => {
  return useQuery<OccupantAssignments>({
    queryKey: ['occupantAssignments', authUserId],
    queryFn: async () => {
      if (!authUserId) throw new Error('No user ID provided');

      console.log('[useOccupantAssignments] Fetching assignments for user:', authUserId);

      // STRATEGY:
      // 1) Try direct match against all supported identity columns using the auth user id.
      //    This covers:
      //    - New assignments: profile_id = auth user id
      //    - Legacy assignments where occupant_id was set to auth user id
      //    - Personnel assignments: personnel_profile_id = auth user id
      // 2) If still nothing, fallback to legacy occupant lookup (by id/email) and query occupant_id.

      const directIdentityFilter = `profile_id.eq.${authUserId},occupant_id.eq.${authUserId},personnel_profile_id.eq.${authUserId}`;

      const [directRoomResult, directKeyResult] = await Promise.all([
        supabase
          .from('occupant_room_assignments')
          .select(ROOM_ASSIGNMENT_SELECT)
          .or(directIdentityFilter),
        supabase
          .from('key_assignments')
          .select(KEY_ASSIGNMENT_SELECT)
          .or(directIdentityFilter)
          .is('returned_at', null)
      ]);

      if (directRoomResult.error) {
        console.error('[useOccupantAssignments] Error fetching direct room assignments:', directRoomResult.error);
      }
      if (directKeyResult.error) {
        console.error('[useOccupantAssignments] Error fetching direct key assignments:', directKeyResult.error);
      }

      const directRoomAssignments = directRoomResult.data || [];
      const directKeyAssignments = directKeyResult.data || [];

      console.log('[useOccupantAssignments] Direct identity results:', {
        rooms: directRoomAssignments.length,
        keys: directKeyAssignments.length
      });

      // If we got anything via direct identity match, return it.
      if (directRoomAssignments.length > 0 || directKeyAssignments.length > 0) {
        const formattedRooms = formatRoomAssignments(directRoomAssignments);
        const formattedKeys = formatKeyAssignments(directKeyAssignments);
        return buildResult(formattedRooms, formattedKeys);
      }

      // 2. Fallback: Legacy occupant_id lookup for backward compatibility (when occupant_id != auth user id)
      console.log('[useOccupantAssignments] No direct identity assignments, trying legacy occupant lookup...');
      
      const occupantId = await resolveOccupantId(authUserId);

      if (!occupantId) {
        console.log('[useOccupantAssignments] No occupant found, returning empty assignments');
        return {
          roomAssignments: [],
          keyAssignments: [],
          primaryRoom: undefined,
          storageAssignments: []
        };
      }

      // Query by legacy occupant_id
      const [legacyRoomResult, legacyKeyResult] = await Promise.all([
        supabase
          .from('occupant_room_assignments')
          .select(ROOM_ASSIGNMENT_SELECT)
          .eq('occupant_id', occupantId),
        supabase
          .from('key_assignments')
          .select(KEY_ASSIGNMENT_SELECT)
          .eq('occupant_id', occupantId)
          .is('returned_at', null)
      ]);

      if (legacyRoomResult.error) {
        console.error('[useOccupantAssignments] Error fetching legacy room assignments:', legacyRoomResult.error);
        throw legacyRoomResult.error;
      }
      if (legacyKeyResult.error) {
        console.error('[useOccupantAssignments] Error fetching legacy key assignments:', legacyKeyResult.error);
        throw legacyKeyResult.error;
      }

      console.log('[useOccupantAssignments] Legacy results:', {
        rooms: legacyRoomResult.data?.length || 0,
        keys: legacyKeyResult.data?.length || 0
      });

      const formattedRooms = formatRoomAssignments(legacyRoomResult.data || []);
      const formattedKeys = formatKeyAssignments(legacyKeyResult.data || []);
      
      return buildResult(formattedRooms, formattedKeys);
    },
    enabled: !!authUserId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
