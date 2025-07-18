import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoomAccessInfo {
  room_id: string;
  room_name: string;
  room_number: string;
  building_name: string;
  floor_name: string;
  room_capacity?: number;
  current_occupancy?: number;
  primary_occupants: Array<{
    id: string;
    first_name: string;
    last_name: string;
    department: string | null;
    assigned_at: string;
  }>;
  secondary_occupants: Array<{
    id: string;
    first_name: string;
    last_name: string;
    department: string | null;
    assigned_at: string;
    assignment_type: string;
  }>;
  key_holders: Array<{
    id: string;
    first_name: string;
    last_name: string;
    department: string | null;
    key_name: string;
    assigned_at: string;
    is_passkey: boolean;
  }>;
  access_doors: Array<{
    id: string;
    name: string;
    keys_count: number;
  }>;
  access_conflicts?: Array<{
    type: 'duplicate_key' | 'capacity_exceeded' | 'unauthorized_access';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export const useRoomAccess = (roomId?: string) => {
  return useQuery<RoomAccessInfo | null>({
    queryKey: ['roomAccess', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('No room ID provided');

      // Get room details
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          room_number,
          floor_id,
          floors (
            id,
            name,
            building_id,
            buildings (
              id,
              name
            )
          )
        `)
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      if (!room) return null;

      // Use the new safe function to get room assignments with details
      const { data: roomAssignments, error: assignmentsError } = await supabase
        .rpc('get_room_assignments_with_details', { p_room_id: roomId });

      if (assignmentsError) throw assignmentsError;

      // Get key assignments for this room specifically
      const { data: keyAssignments, error: keyError } = await supabase
        .from('key_assignments')
        .select(`
          id,
          assigned_at,
          key_id,
          occupant_id
        `)
        .is('returned_at', null);

      if (keyError) throw keyError;

      // Get key details and occupant details for key assignments
      const keyIds = (keyAssignments || []).map(a => a.key_id).filter(Boolean);
      const keyOccupantIds = (keyAssignments || []).map(a => a.occupant_id).filter(Boolean);
      
      const [keysResult, keyOccupantsResult] = await Promise.all([
        keyIds.length > 0 
          ? supabase.from('keys').select('id, name, is_passkey, location_data').in('id', keyIds)
          : { data: [], error: null },
        keyOccupantIds.length > 0 
          ? supabase.from('occupants').select('id, first_name, last_name, department').in('id', keyOccupantIds)
          : { data: [], error: null }
      ]);

      if (keysResult.error) throw keysResult.error;
      if (keyOccupantsResult.error) throw keyOccupantsResult.error;

      // Get doors on the same floor as this room
      const { data: roomDoors, error: roomDoorsError } = await supabase
        .from('doors')
        .select('id, name')
        .eq('floor_id', room.floor_id);

      if (roomDoorsError) throw roomDoorsError;

      // Filter key assignments that are relevant to this room
      const relevantKeyAssignments = (keyAssignments || []).filter(assignment => {
        const key = keysResult.data?.find(k => k.id === assignment.key_id);
        const locationData = key?.location_data as any;
        
        // Only include keys that specifically grant access to this room
        return (locationData && typeof locationData === 'object' && locationData.room_id === roomId) ||
               (key?.is_passkey && locationData && typeof locationData === 'object' && 
                locationData.access_scope === 'building' && locationData.building_id === room.floors?.buildings?.id);
      });

      // Create a lookup map for key occupants
      const keyOccupantMap = new Map();
      (keyOccupantsResult.data || []).forEach(occ => keyOccupantMap.set(occ.id, occ));

      // Parse occupant names from the function response
      const primary_occupants = (roomAssignments || []).filter(a => a.is_primary).map(a => {
        const nameParts = (a.occupant_name || '').split(' ');
        return {
          id: a.occupant_id || '',
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          department: null, // Not available from the function
          assigned_at: a.assigned_at
        };
      });

      const secondary_occupants = (roomAssignments || []).filter(a => !a.is_primary).map(a => {
        const nameParts = (a.occupant_name || '').split(' ');
        return {
          id: a.occupant_id || '',
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          department: null, // Not available from the function
          assigned_at: a.assigned_at,
          assignment_type: a.assignment_type || 'secondary'
        };
      });

      const key_holders = relevantKeyAssignments.map(a => {
        const occupant = keyOccupantMap.get(a.occupant_id);
        const key = keysResult.data?.find(k => k.id === a.key_id);
        return {
          id: occupant?.id || '',
          first_name: occupant?.first_name || '',
          last_name: occupant?.last_name || '',
          department: occupant?.department,
          key_name: key?.name || '',
          assigned_at: a.assigned_at,
          is_passkey: key?.is_passkey || false
        };
      });

      // Access doors information
      const access_doors = (roomDoors || []).map(door => ({
        id: door.id,
        name: door.name,
        keys_count: relevantKeyAssignments.filter(ka => {
          const key = keysResult.data?.find(k => k.id === ka.key_id);
          return key?.is_passkey;
        }).length
      }));

      const totalOccupants = primary_occupants.length + secondary_occupants.length;

      return {
        room_id: room.id,
        room_name: room.name,
        room_number: room.room_number || '',
        building_name: room.floors?.buildings?.name || '',
        floor_name: room.floors?.name || '',
        room_capacity: undefined,
        current_occupancy: totalOccupants,
        primary_occupants,
        secondary_occupants,
        key_holders,
        access_doors,
        access_conflicts: []
      };
    },
    enabled: !!roomId,
  });
};