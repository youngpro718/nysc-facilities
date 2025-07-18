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
            name,
            buildings (
              name
            )
          )
        `)
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      if (!room) return null;

      // Get room assignments (primary and secondary occupants)
      const { data: roomAssignments, error: assignmentsError } = await supabase
        .from('occupant_room_assignments')
        .select(`
          id,
          assigned_at,
          is_primary,
          assignment_type,
          occupant_id
        `)
        .eq('room_id', roomId)
        .is('expiration_date', null);

      if (assignmentsError) throw assignmentsError;

      // Get occupant details separately
      const occupantIds = (roomAssignments || []).map(a => a.occupant_id).filter(Boolean);
      const { data: occupants, error: occupantsError } = occupantIds.length > 0 
        ? await supabase
            .from('occupants')
            .select('id, first_name, last_name, department')
            .in('id', occupantIds)
        : { data: [], error: null };

      if (occupantsError) throw occupantsError;

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
        return key?.is_passkey || 
               (locationData && typeof locationData === 'object' && locationData.room_id === roomId);
      });

      // Create a lookup map for occupants
      const occupantMap = new Map();
      (occupants || []).forEach(occ => occupantMap.set(occ.id, occ));
      
      const keyOccupantMap = new Map();
      (keyOccupantsResult.data || []).forEach(occ => keyOccupantMap.set(occ.id, occ));

      const primary_occupants = (roomAssignments || []).filter(a => a.is_primary).map(a => {
        const occupant = occupantMap.get(a.occupant_id);
        return {
          id: occupant?.id || '',
          first_name: occupant?.first_name || '',
          last_name: occupant?.last_name || '',
          department: occupant?.department,
          assigned_at: a.assigned_at
        };
      });

      const secondary_occupants = (roomAssignments || []).filter(a => !a.is_primary).map(a => {
        const occupant = occupantMap.get(a.occupant_id);
        return {
          id: occupant?.id || '',
          first_name: occupant?.first_name || '',
          last_name: occupant?.last_name || '',
          department: occupant?.department,
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