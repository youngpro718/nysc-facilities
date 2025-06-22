
import { supabase } from "@/integrations/supabase/client";
import { RoomRelocation } from "../../types/relocationTypes";

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

  return data as RoomRelocation;
}

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

  return data as RoomRelocation;
}

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

  return data as RoomRelocation;
}
