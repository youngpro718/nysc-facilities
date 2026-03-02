
import { supabase } from "@/lib/supabase";
import { logger } from '@/lib/logger';

export async function deleteSpace(id: string, type: 'room' | 'hallway' | 'door') {
  logger.debug(`Deleting ${type} with ID: ${id}`);
  
  try {
    if (type === 'room') {
      // Use cascade delete function to handle all FK dependencies
      const { error } = await supabase.rpc('delete_room_cascade', { p_room_id: id });
      if (error) {
        logger.error("Error deleting room (cascade):", error);
        throw error;
      }
    } else if (type === 'hallway') {
      const { error: hallwayError } = await supabase
        .from("hallways")
        .delete()
        .eq("id", id);
      if (hallwayError) {
        logger.error("Error deleting hallway:", hallwayError);
        throw hallwayError;
      }
    } else if (type === 'door') {
      const { error: doorError } = await supabase
        .from("doors")
        .delete()
        .eq("id", id);
      if (doorError) {
        logger.error("Error deleting door:", doorError);
        throw doorError;
      }
    }
    
    return { success: true };
  } catch (error) {
    logger.error("Error in deleteSpace:", error);
    throw error;
  }
}
