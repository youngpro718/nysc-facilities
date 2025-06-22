
import { supabase } from "@/integrations/supabase/client";

// Update types to match actual database schema
export interface ScheduleChange {
  id: string;
  relocation_id: string;
  original_court_part: string;
  temporary_assignment: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'scheduled' | 'completed' | 'cancelled';
  special_instructions: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleChangeFormData {
  relocation_id: string;
  original_court_part: string;
  temporary_assignment: string;
  start_date: string;
  end_date: string;
  special_instructions?: string;
}

export interface UpdateScheduleChangeFormData {
  id: string;
  original_court_part: string;
  temporary_assignment: string;
  start_date: string;
  end_date: string;
  special_instructions?: string;
  created_by?: string;
}

export const fetchScheduleChanges = async (relocationId: string): Promise<ScheduleChange[]> => {
  const { data, error } = await supabase
    .from('schedule_changes')
    .select('*')
    .eq('relocation_id', relocationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching schedule changes:', error);
    throw error;
  }

  return data || [];
};

export const createScheduleChange = async (formData: CreateScheduleChangeFormData): Promise<ScheduleChange> => {
  const { data, error } = await supabase
    .from('schedule_changes')
    .insert({
      relocation_id: formData.relocation_id,
      original_court_part: formData.original_court_part,
      temporary_assignment: formData.temporary_assignment,
      start_date: formData.start_date,
      end_date: formData.end_date,
      special_instructions: formData.special_instructions || '',
      status: 'scheduled',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating schedule change:', error);
    throw error;
  }

  return data;
};

export const updateScheduleChange = async (formData: UpdateScheduleChangeFormData): Promise<ScheduleChange> => {
  const { data, error } = await supabase
    .from('schedule_changes')
    .update({
      original_court_part: formData.original_court_part,
      temporary_assignment: formData.temporary_assignment,
      start_date: formData.start_date,
      end_date: formData.end_date,
      special_instructions: formData.special_instructions || '',
      created_by: formData.created_by,
      updated_at: new Date().toISOString()
    })
    .eq('id', formData.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating schedule change:', error);
    throw error;
  }

  return data;
};

export const deleteScheduleChange = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('schedule_changes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting schedule change:', error);
    throw error;
  }
};
