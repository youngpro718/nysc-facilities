
import { supabase } from "@/integrations/supabase/client";

export async function deleteSpace(id: string, type: 'room' | 'hallway' | 'door') {
  console.log(`Deleting ${type} with ID: ${id}`);
  
  try {
    // First, deactivate any connections to this space
    const { error: connectionError } = await supabase
      .from("space_connections")
      .update({ status: "inactive" })
      .or(`from_space_id.eq.${id},to_space_id.eq.${id}`);
      
    if (connectionError) {
      console.error("Error deactivating connections:", connectionError);
      throw connectionError;
    }
    
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
    } else {
      // For hallways or doors, delete from new_spaces table
      const { error: spaceError } = await supabase
        .from("new_spaces")
        .delete()
        .eq("id", id);
        
      if (spaceError) {
        console.error(`Error deleting ${type}:`, spaceError);
        throw spaceError;
      }
      
      // Delete type-specific properties
      if (type === 'hallway') {
        await supabase
          .from("hallway_properties")
          .delete()
          .eq("space_id", id);
      } else if (type === 'door') {
        await supabase
          .from("door_properties")
          .delete()
          .eq("space_id", id);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in deleteSpace:", error);
    throw error;
  }
}
