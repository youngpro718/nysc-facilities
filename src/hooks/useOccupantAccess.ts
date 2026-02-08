import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface OccupantAccessSummary {
  occupant_id: string;
  occupant_name: string;
  department: string | null;
  room_assignments: Array<{
    id: string;
    room_id: string;
    room_name: string;
    room_number: string;
    building_name: string;
    floor_name: string;
    is_primary: boolean;
    assignment_type: string;
    assigned_at: string;
  }>;
  key_assignments: Array<{
    id: string;
    key_id: string;
    key_name: string;
    is_passkey: boolean;
    assigned_at: string;
    access_note: string; // What this key provides access to
  }>;
}

export const useOccupantAccess = (occupantId?: string) => {
  return useQuery<OccupantAccessSummary | null>({
    queryKey: ['occupantAccess', occupantId],
    queryFn: async () => {
      if (!occupantId) throw new Error('No occupant ID provided');

      logger.debug('Fetching occupant access for:', occupantId);

      // Get occupant details
      const { data: occupant, error: occupantError } = await supabase
        .from('occupants')
        .select('id, first_name, last_name, department')
        .eq('id', occupantId)
        .single();

      if (occupantError) {
        logger.error('Occupant error:', occupantError);
        throw occupantError;
      }
      if (!occupant) return null;

      logger.debug('Occupant found:', occupant);

      // Get room assignments
      const { data: roomAssignments, error: roomError } = await supabase
        .from('occupant_room_assignments')
        .select(`
          id,
          room_id,
          is_primary,
          assignment_type,
          assigned_at,
          rooms!occupant_room_assignments_room_id_fkey (
            id,
            name,
            room_number,
            floors (
              name,
              buildings (
                name
              )
            )
          )
        `)
        .eq('occupant_id', occupantId);

      if (roomError) {
        logger.error('Room assignments error:', roomError);
        throw roomError;
      }

      logger.debug('Room assignments found:', roomAssignments);

      // Get key assignments (simplified - no door mappings needed)
      const { data: keyAssignments, error: keyError } = await supabase
        .from('key_assignments')
        .select(`
          id,
          key_id,
          assigned_at,
          keys (
            id,
            name,
            is_passkey
          )
        `)
        .eq('occupant_id', occupantId)
        .is('returned_at', null);

      if (keyError) {
        logger.error('Key assignments error:', keyError);
        throw keyError;
      }

      logger.debug('Key assignments found:', keyAssignments);

      const room_assignments = roomAssignments?.map(assignment => {
        const room = Array.isArray(assignment.rooms) ? assignment.rooms[0] : assignment.rooms;
        const floor = Array.isArray(room?.floors) ? room.floors[0] : room?.floors;
        const building = Array.isArray(floor?.buildings) ? floor.buildings[0] : floor?.buildings;
        
        return {
          id: assignment.id,
          room_id: assignment.room_id,
          room_name: room?.name || '',
          room_number: room?.room_number || '',
          building_name: building?.name || '',
          floor_name: floor?.name || '',
          is_primary: assignment.is_primary,
          assignment_type: assignment.assignment_type || '',
          assigned_at: assignment.assigned_at
        };
      }) || [];

      // Helper function to generate access note based on key
      const getAccessNote = (keyName: string, isPasskey: boolean): string => {
        if (isPasskey) {
          return `Master Key - General Building Access`;
        }
        
        // Private key - show what it specifically accesses
        switch (keyName.toLowerCase()) {
          case 'clerks office':
            return 'Central Clerks Office Access';
          case '111 m':
            return 'Room 111M Access';
          case 'hogan st.':
            return 'Hogan Street Entrance Access';
          case 'm4':
            return 'M4 Area Access';
          default:
            return `Private Key - ${keyName} Access`;
        }
      };
      
      const key_assignments = keyAssignments?.map(assignment => {
        const key = Array.isArray(assignment.keys) ? assignment.keys[0] : assignment.keys;
        
        return {
          id: assignment.id,
          key_id: assignment.key_id,
          key_name: key?.name || '',
          is_passkey: key?.is_passkey || false,
          assigned_at: assignment.assigned_at,
          access_note: getAccessNote(key?.name || '', key?.is_passkey || false)
        };
      }) || [];

      const result = {
        occupant_id: occupant.id,
        occupant_name: `${occupant.first_name} ${occupant.last_name}`,
        department: occupant.department,
        room_assignments,
        key_assignments
      };

      logger.debug('Final occupant access result:', result);
      return result;
    },
    enabled: !!occupantId,
  });
};