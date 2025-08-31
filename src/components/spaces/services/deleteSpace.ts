
import { supabase } from "@/lib/supabase";

export async function deleteSpace(id: string, type: 'room' | 'hallway' | 'door') {
  console.log(`Deleting ${type} with ID: ${id}`);
  
  try {
    // Delete the space based on its type
    if (type === 'room') {
      const { error: roomError } = await supabase
        .from("rooms")
        .delete()
        .eq("id", id);
        
      if (roomError) {
        console.error("Error deleting room:", roomError);
        throw roomError;
      }
    } else if (type === 'hallway') {
      const { error: hallwayError } = await supabase
        .from("hallways")
        .delete()
        .eq("id", id);
        
      if (hallwayError) {
        console.error("Error deleting hallway:", hallwayError);
        throw hallwayError;
      }
    } else if (type === 'door') {
      const { error: doorError } = await supabase
        .from("doors")
        .delete()
        .eq("id", id);
        
      if (doorError) {
        console.error("Error deleting door:", doorError);
        throw doorError;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in deleteSpace:", error);
    throw error;
  }
}
