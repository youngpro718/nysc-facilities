
import { supabase } from "@/integrations/supabase/client";
import { CreateScheduleChangeFormData, UpdateScheduleChangeFormData, ScheduleChange, RelocationStatus } from "../types/relocationTypes";

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
      status: 'scheduled' as RelocationStatus,
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
