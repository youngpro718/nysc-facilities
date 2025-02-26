import { supabase } from "@/integrations/supabase/client";
import {
  RoomRelocation,
  ScheduleChange,
  ActiveRelocation,
  CreateRelocationFormData,
  UpdateRelocationFormData,
  CreateScheduleChangeFormData,
  UpdateScheduleChangeFormData
} from "../types/relocationTypes";

// Fetch all relocations with optional filters
export async function fetchRelocations(
  status?: string,
  buildingId?: string,
  floorId?: string,
  startDate?: string,
  endDate?: string
) {
  let query = supabase
    .from('room_relocations')
    .select(`
      *,
      original_room:original_room_id (
        id,
        name,
        room_number,
        floor_id,
        floors!inner (
          id,
          name,
          buildings!inner (
            id,
            name
          )
        )
      ),
      temporary_room:temporary_room_id (
        id,
        name,
        room_number,
        floor_id,
        floors!inner (
          id,
          name,
          buildings!inner (
            id,
            name
          )
        )
      )
    `);

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }

  if (startDate) {
    query = query.gte('start_date', startDate);
  }

  if (endDate) {
    query = query.lte('expected_end_date', endDate);
  }

  if (buildingId) {
    query = query.or(`original_room.floors.buildings.id.eq.${buildingId},temporary_room.floors.buildings.id.eq.${buildingId}`);
  }

  if (floorId) {
    query = query.or(`original_room.floor_id.eq.${floorId},temporary_room.floor_id.eq.${floorId}`);
  }

  const { data, error } = await query.order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching relocations:', error);
    throw error;
  }

  return data as RoomRelocation[];
}

// Fetch active relocations from the view
export async function fetchActiveRelocations() {
  const { data, error } = await supabase
    .from('active_relocations')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching active relocations:', error);
    throw error;
  }

  return data as ActiveRelocation[];
}

// Fetch a single relocation by ID
export async function fetchRelocationById(id: string) {
  const { data, error } = await supabase
    .from('room_relocations')
    .select(`
      *,
      original_room:original_room_id (
        id,
        name,
        room_number,
        floor_id,
        floors!inner (
          id,
          name,
          buildings!inner (
            id,
            name
          )
        )
      ),
      temporary_room:temporary_room_id (
        id,
        name,
        room_number,
        floor_id,
        floors!inner (
          id,
          name,
          buildings!inner (
            id,
            name
          )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching relocation with ID ${id}:`, error);
    throw error;
  }

  return data as RoomRelocation;
}

// Create a new relocation
export async function createRelocation(formData: CreateRelocationFormData) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Start a transaction
  const { data, error } = await supabase
    .from('room_relocations')
    .insert({
      original_room_id: formData.original_room_id,
      temporary_room_id: formData.temporary_room_id,
      start_date: formData.start_date,
      expected_end_date: formData.expected_end_date,
      reason: formData.reason,
      notes: formData.notes,
      status: 'pending',
      created_by: userData.user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating relocation:', error);
    throw error;
  }

  // If there are schedule changes, create them
  if (formData.schedule_changes && formData.schedule_changes.length > 0) {
    const scheduleChanges = formData.schedule_changes.map(change => ({
      relocation_id: data.id,
      original_court_part: change.original_court_part,
      temporary_assignment: change.temporary_assignment,
      start_date: formData.start_date,
      end_date: formData.expected_end_date,
      special_instructions: change.special_instructions,
      status: 'pending',
      created_by: userData.user.id
    }));

    const { error: scheduleError } = await supabase
      .from('schedule_changes')
      .insert(scheduleChanges);

    if (scheduleError) {
      console.error('Error creating schedule changes:', scheduleError);
      throw scheduleError;
    }
  }

  return data as RoomRelocation;
}

// Update an existing relocation
export async function updateRelocation(formData: UpdateRelocationFormData) {
  const { data, error } = await supabase
    .from('room_relocations')
    .update({
      temporary_room_id: formData.temporary_room_id,
      expected_end_date: formData.expected_end_date,
      actual_end_date: formData.actual_end_date,
      reason: formData.reason,
      status: formData.status,
      notes: formData.notes
    })
    .eq('id', formData.id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating relocation with ID ${formData.id}:`, error);
    throw error;
  }

  return data as RoomRelocation;
}

// Activate a relocation
export async function activateRelocation(id: string) {
  const { data, error } = await supabase
    .from('room_relocations')
    .update({ status: 'active' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error activating relocation with ID ${id}:`, error);
    throw error;
  }

  // Also activate any associated schedule changes
  const { error: scheduleError } = await supabase
    .from('schedule_changes')
    .update({ status: 'active' })
    .eq('relocation_id', id)
    .eq('status', 'pending');

  if (scheduleError) {
    console.error(`Error activating schedule changes for relocation ${id}:`, scheduleError);
    throw scheduleError;
  }

  return data as RoomRelocation;
}

// Complete a relocation
export async function completeRelocation(id: string) {
  const { data, error } = await supabase
    .from('room_relocations')
    .update({ 
      status: 'completed',
      actual_end_date: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error completing relocation with ID ${id}:`, error);
    throw error;
  }

  // Also complete any associated schedule changes
  const { error: scheduleError } = await supabase
    .from('schedule_changes')
    .update({ 
      status: 'completed',
      end_date: new Date().toISOString()
    })
    .eq('relocation_id', id)
    .eq('status', 'active');

  if (scheduleError) {
    console.error(`Error completing schedule changes for relocation ${id}:`, scheduleError);
    throw scheduleError;
  }

  return data as RoomRelocation;
}

// Cancel a relocation
export async function cancelRelocation(id: string) {
  const { data, error } = await supabase
    .from('room_relocations')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error cancelling relocation with ID ${id}:`, error);
    throw error;
  }

  // Also cancel any associated schedule changes
  const { error: scheduleError } = await supabase
    .from('schedule_changes')
    .update({ status: 'cancelled' })
    .eq('relocation_id', id)
    .in('status', ['pending', 'active']);

  if (scheduleError) {
    console.error(`Error cancelling schedule changes for relocation ${id}:`, scheduleError);
    throw scheduleError;
  }

  return data as RoomRelocation;
}

// Fetch schedule changes for a relocation
export async function fetchScheduleChanges(relocationId: string) {
  const { data, error } = await supabase
    .from('schedule_changes')
    .select('*')
    .eq('relocation_id', relocationId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error(`Error fetching schedule changes for relocation ${relocationId}:`, error);
    throw error;
  }

  return data as ScheduleChange[];
}

// Create a new schedule change
export async function createScheduleChange(formData: CreateScheduleChangeFormData) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('schedule_changes')
    .insert({
      relocation_id: formData.relocation_id,
      original_court_part: formData.original_court_part,
      temporary_assignment: formData.temporary_assignment,
      start_date: formData.start_date,
      end_date: formData.end_date,
      special_instructions: formData.special_instructions,
      status: 'pending',
      created_by: userData.user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating schedule change:', error);
    throw error;
  }

  return data as ScheduleChange;
}

// Update an existing schedule change
export async function updateScheduleChange(formData: UpdateScheduleChangeFormData) {
  const { data, error } = await supabase
    .from('schedule_changes')
    .update({
      temporary_assignment: formData.temporary_assignment,
      end_date: formData.end_date,
      special_instructions: formData.special_instructions,
      status: formData.status
    })
    .eq('id', formData.id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating schedule change with ID ${formData.id}:`, error);
    throw error;
  }

  return data as ScheduleChange;
}

// Delete a schedule change
export async function deleteScheduleChange(id: string) {
  const { error } = await supabase
    .from('schedule_changes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting schedule change with ID ${id}:`, error);
    throw error;
  }

  return true;
} 