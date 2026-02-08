
import { supabase } from "@/lib/supabase";
import { logger } from '@/lib/logger';

export async function deleteSpace(id: string, type: 'room' | 'hallway' | 'door') {
  logger.debug(`Deleting ${type} with ID: ${id}`);
  
  try {
    // Delete the space based on its type
    if (type === 'room') {
      const { error: roomError } = await supabase
        .from("rooms")
        .delete()
        .eq("id", id);
        
      if (roomError) {
        logger.error("Error deleting room:", roomError);
        throw roomError;
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
