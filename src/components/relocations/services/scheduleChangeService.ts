
import { supabase } from "@/integrations/supabase/client";
import { ScheduleChange, CreateScheduleChangeFormData, UpdateScheduleChangeFormData } from "../types/relocationTypes";

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
      change_type: formData.change_type,
      new_start_date: formData.new_start_date,
      new_end_date: formData.new_end_date,
      reason: formData.reason,
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
      change_type: formData.change_type,
      new_start_date: formData.new_start_date,
      new_end_date: formData.new_end_date,
      reason: formData.reason,
      approved_by: formData.approved_by,
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
