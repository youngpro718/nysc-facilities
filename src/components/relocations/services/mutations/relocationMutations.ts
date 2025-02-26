
import { supabase } from "@/integrations/supabase/client";
import { CreateRelocationFormData, UpdateRelocationFormData, RoomRelocation } from "../../types/relocationTypes";

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
