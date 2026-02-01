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

/**
 * Resolves the occupant ID for a given auth user ID.
 * Strategy:
 * 1. Try to find occupant by direct ID match (occupants.id = authUserId)
 * 2. If not found, get user's email from profiles and match by email
 */
async function resolveOccupantId(authUserId: string): Promise<string | null> {
  console.log('[useOccupantAssignments] Resolving occupant for authUserId:', authUserId);
  
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

  console.log('[useOccupantAssignments] No direct ID match, trying email lookup...');

  // Second try: match by email
  // Get user's email from profiles
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
  console.log('[useOccupantAssignments] Looking up occupant by email:', normalizedEmail);

  // Find occupant by email (case-insensitive with wildcards for trimming)
  const { data: emailMatch, error: emailError } = await supabase
    .from('occupants')
    .select('id, email')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (emailError) {
    console.log('[useOccupantAssignments] Email match query error:', emailError);
  }

  if (emailMatch?.id) {
    console.log('[useOccupantAssignments] Found occupant by email match:', emailMatch.id, 'email:', emailMatch.email);
    return emailMatch.id;
  }

  console.log('[useOccupantAssignments] No occupant found for this user');
  return null;
}

export const useOccupantAssignments = (authUserId: string) => {
  return useQuery<OccupantAssignments>({
    queryKey: ['occupantAssignments', authUserId],
    queryFn: async () => {
      if (!authUserId) throw new Error('No user ID provided');

      try {
        // Resolve the actual occupant ID
        const occupantId = await resolveOccupantId(authUserId);

        if (!occupantId) {
          // No occupant record found - return empty assignments
          return {
            roomAssignments: [],
            keyAssignments: [],
            primaryRoom: undefined,
            storageAssignments: []
          };
        }

        // Fetch room assignments with full details
        const { data: roomAssignments, error: roomError } = await supabase
          .from('occupant_room_assignments')
          .select(`
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
          `)
          .eq('occupant_id', occupantId);

        if (roomError) {
          console.error('[useOccupantAssignments] Error fetching room assignments:', roomError);
          throw roomError;
        }

        console.log('[useOccupantAssignments] Raw room assignments:', roomAssignments?.length || 0, roomAssignments);

        // Fetch key assignments with room details
        const { data: keyAssignments, error: keyError } = await supabase
          .from('key_assignments')
          .select(`
            id,
            key_id,
            assigned_at,
            is_spare,
            keys!key_assignments_key_id_fkey (
              id,
              name,
              type
            )
          `)
          .eq('occupant_id', occupantId)
          .is('returned_at', null);

        if (keyError) {
          console.error('Error fetching key assignments:', keyError);
          throw keyError;
        }

        // Format room assignments
        const formattedRoomAssignments: DetailedRoomAssignment[] = (roomAssignments || []).map((assignment: any) => ({
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

        // Format key assignments
        const formattedKeyAssignments: DetailedKeyAssignment[] = (keyAssignments || []).map((assignment: any) => ({
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

        // Find primary room - prioritize is_primary boolean, then primary_office type, else first
        const primaryRoom = formattedRoomAssignments.find(room => room.is_primary) 
          || formattedRoomAssignments.find(room => room.assignment_type === 'primary_office')
          || formattedRoomAssignments[0];
        
        // Separate storage room assignments
        const storageAssignments = formattedRoomAssignments.filter(room => room.is_storage);

        return {
          roomAssignments: formattedRoomAssignments,
          keyAssignments: formattedKeyAssignments,
          primaryRoom,
          storageAssignments
        };
      } catch (error) {
        console.error('Error in useOccupantAssignments:', error);
        throw error;
      }
    },
    enabled: !!authUserId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
