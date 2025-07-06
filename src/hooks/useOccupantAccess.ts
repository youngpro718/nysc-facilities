import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

      console.log('Fetching occupant access for:', occupantId);

      // Get occupant details
      const { data: occupant, error: occupantError } = await supabase
        .from('occupants')
        .select('id, first_name, last_name, department')
        .eq('id', occupantId)
        .single();

      if (occupantError) {
        console.error('Occupant error:', occupantError);
        throw occupantError;
      }
      if (!occupant) return null;

      console.log('Occupant found:', occupant);

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
        console.error('Room assignments error:', roomError);
        throw roomError;
      }

      console.log('Room assignments found:', roomAssignments);

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
        console.error('Key assignments error:', keyError);
        throw keyError;
      }

      console.log('Key assignments found:', keyAssignments);

      const room_assignments = roomAssignments?.map(assignment => ({
        id: assignment.id,
        room_id: assignment.room_id,
        room_name: assignment.rooms?.name || '',
        room_number: assignment.rooms?.room_number || '',
        building_name: assignment.rooms?.floors?.buildings?.name || '',
        floor_name: assignment.rooms?.floors?.name || '',
        is_primary: assignment.is_primary,
        assignment_type: assignment.assignment_type || '',
        assigned_at: assignment.assigned_at
      })) || [];

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
      
      const key_assignments = keyAssignments?.map(assignment => ({
        id: assignment.id,
        key_id: assignment.key_id,
        key_name: assignment.keys?.name || '',
        is_passkey: assignment.keys?.is_passkey || false,
        assigned_at: assignment.assigned_at,
        access_note: getAccessNote(assignment.keys?.name || '', assignment.keys?.is_passkey || false)
      })) || [];

      const result = {
        occupant_id: occupant.id,
        occupant_name: `${occupant.first_name} ${occupant.last_name}`,
        department: occupant.department,
        room_assignments,
        key_assignments
      };

      console.log('Final occupant access result:', result);
      return result;
    },
    enabled: !!occupantId,
  });
};