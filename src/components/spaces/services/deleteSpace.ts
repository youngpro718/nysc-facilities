
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function deleteSpace(id: string, type: 'room' | 'hallway' | 'door' = 'room') {
  try {
    // First delete any connections
    const { error: connectionsError } = await supabase
      .from('space_connections')
      .update({ status: 'inactive' })
      .eq('from_space_id', id);
    
    if (connectionsError) {
      console.error("Error deactivating connections:", connectionsError);
      // Continue despite error to try to delete the space
    }
    
    // Delete based on space type
    if (type === 'room') {
      const { error: roomError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
        
      if (roomError) throw roomError;
    } else if (type === 'hallway' || type === 'door') {
      // For hallway or door, delete from new_spaces table
      const { error: spaceError } = await supabase
        .from('new_spaces')
        .delete()
        .eq('id', id);
        
      if (spaceError) throw spaceError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting space:', error);
    toast.error('Failed to delete space');
    throw error;
  }
}
