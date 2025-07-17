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
          occupant_id,
          occupants!fk_occupant_room_assignments_occupant (
            id,
            first_name,
            last_name,
            department
          )
        `)
        .eq('room_id', roomId);

      if (assignmentsError) throw assignmentsError;

      // Simplified key assignments query for now
      const { data: keyAssignments, error: keyError } = await supabase
        .from('key_assignments')
        .select(`
          id,
          assigned_at,
          keys (
            id,
            name,
            is_passkey
          ),
          occupants (
            id,
            first_name,
            last_name,
            department
          )
        `)
        .is('returned_at', null);

      if (keyError) throw keyError;

      // Get doors on the same floor as this room
      const { data: roomDoors, error: roomDoorsError } = await supabase
        .from('doors')
        .select('id, name')
        .eq('floor_id', room.floor_id);

      if (roomDoorsError) throw roomDoorsError;

      // Filter key assignments (simplified for now - just passkeys)
      const relevantKeyAssignments = (keyAssignments || []).filter(assignment => 
        assignment.keys?.is_passkey
      );

      const primary_occupants = (roomAssignments || []).filter(a => a.is_primary).map(a => ({
        id: a.occupants?.id || '',
        first_name: a.occupants?.first_name || '',
        last_name: a.occupants?.last_name || '',
        department: a.occupants?.department,
        assigned_at: a.assigned_at
      }));

      const secondary_occupants = (roomAssignments || []).filter(a => !a.is_primary).map(a => ({
        id: a.occupants?.id || '',
        first_name: a.occupants?.first_name || '',
        last_name: a.occupants?.last_name || '',
        department: a.occupants?.department,
        assigned_at: a.assigned_at,
        assignment_type: a.assignment_type || 'secondary'
      }));

      const key_holders = relevantKeyAssignments.map(a => ({
        id: a.occupants?.id || '',
        first_name: a.occupants?.first_name || '',
        last_name: a.occupants?.last_name || '',
        department: a.occupants?.department,
        key_name: a.keys?.name || '',
        assigned_at: a.assigned_at,
        is_passkey: a.keys?.is_passkey || false
      }));

      // Access doors information
      const access_doors = (roomDoors || []).map(door => ({
        id: door.id,
        name: door.name,
        keys_count: relevantKeyAssignments.filter(ka => ka.keys?.is_passkey).length
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