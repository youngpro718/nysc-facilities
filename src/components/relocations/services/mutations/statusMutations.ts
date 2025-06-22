
import { supabase } from "@/integrations/supabase/client";
import { RoomRelocation, RelocationStatus } from "../../types/relocationTypes";

export async function activateRelocation(id: string) {
  const { data, error } = await supabase
    .from('room_relocations')
    .update({ status: 'active' as RelocationStatus })
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
    .update({ status: 'active' as RelocationStatus })
    .eq('relocation_id', id)
    .eq('status', 'scheduled');

  if (scheduleError) {
    console.error(`Error activating schedule changes for relocation ${id}:`, scheduleError);
    throw scheduleError;
  }

  return data as RoomRelocation;
}

export async function completeRelocation(id: string) {
  const { data, error } = await supabase
    .from('room_relocations')
    .update({ 
      status: 'completed' as RelocationStatus,
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
      status: 'completed' as RelocationStatus,
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

export async function cancelRelocation(id: string) {
  const { data, error } = await supabase
    .from('room_relocations')
    .update({ status: 'cancelled' as RelocationStatus })
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
    .update({ status: 'cancelled' as RelocationStatus })
    .eq('relocation_id', id)
    .in('status', ['scheduled', 'active']);

  if (scheduleError) {
    console.error(`Error cancelling schedule changes for relocation ${id}:`, scheduleError);
    throw scheduleError;
  }

  return data as RoomRelocation;
}
