
import { supabase } from "@/integrations/supabase/client";
import { CreateRelocationFormData, UpdateRelocationFormData, RoomRelocation } from "../../types/relocationTypes";

export async function createRelocation(formData: CreateRelocationFormData) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const insertData = {
    original_room_id: formData.original_room_id,
    temporary_room_id: formData.temporary_room_id,
    start_date: formData.start_date,
    end_date: formData.end_date,
    reason: formData.reason,
    notes: formData.notes,
    relocation_type: formData.relocation_type === 'planned' ? 'other' : formData.relocation_type,
    status: 'scheduled' as const,
    created_by: userData.user.id,
    special_instructions: formData.special_instructions,
    metadata: formData.term_id ? { term_id: formData.term_id } : null
  };

  const { data, error } = await supabase
    .from('room_relocations')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating relocation:', error);
    throw error;
  }

  return data as RoomRelocation;
}

export async function updateRelocation(formData: UpdateRelocationFormData) {
  const updateData: any = {
    temporary_room_id: formData.temporary_room_id,
    end_date: formData.end_date,
    actual_end_date: formData.actual_end_date,
    reason: formData.reason,
    status: formData.status,
    notes: formData.notes,
    special_instructions: formData.special_instructions
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  const { data, error } = await supabase
    .from('room_relocations')
    .update(updateData)
    .eq('id', formData.id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating relocation with ID ${formData.id}:`, error);
    throw error;
  }

  return data as RoomRelocation;
}
