
import { supabase } from "@/integrations/supabase/client";

export const fetchRoomsData = async () => {
  return await supabase
    .from('rooms')
    .select(`
      id,
      name,
      room_number,
      room_type,
      description,
      status,
      floor_id,
      parent_room_id,
      is_storage,
      storage_capacity,
      storage_type,
      storage_notes,
      phone_number,
      created_at,
      current_function,
      previous_functions,
      function_change_date,
      floors:floor_id (
        name,
        buildings:building_id (
          id,
          name
        )
      ),
      parent_room:parent_room_id (
        name
      )
    `);
};

export const fetchRelatedRoomData = async (roomIds: string[]) => {
  return Promise.all([
    // Fetch occupants - using the correct relationship name
    supabase
      .from('occupant_room_assignments')
      .select(`
        room_id,
        assignment_type,
        is_primary,
        schedule,
        occupants!fk_occupant_room_assignments_occupant (
          first_name,
          last_name,
          title
        )
      `)
      .in('room_id', roomIds),

    // Fetch issues
    supabase
      .from('issues')
      .select('id, title, status, type, priority, created_at, room_id')
      .in('room_id', roomIds),

    // Fetch room history
    supabase
      .from('room_history')
      .select('room_id, change_type, previous_values, new_values, created_at')
      .in('room_id', roomIds),

    // Fetch lighting fixtures
    supabase
      .from('lighting_fixture_details')
      .select('*')
      .in('space_id', roomIds)
  ]);
};
