
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";

// Helper function to convert storage capacity string to number
const getNumericCapacity = (capacity: string | null): number | null => {
  if (!capacity) return null;
  switch(capacity) {
    case 'small': return 100;
    case 'medium': return 200;
    case 'large': return 300;
    default: return null;
  }
};

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  // Create base space record
  const spaceData = {
    name: data.name,
    type: data.type,
    floor_id: data.floorId,
    status: data.status,
    position: data.position || { x: 0, y: 0 },
    size: data.type === 'door' ? 
      { width: 60, height: 20 } : 
      data.size || { width: 150, height: 100 },
    rotation: data.rotation || 0
  };

  const { data: space, error: spaceError } = await supabase
    .from('new_spaces')
    .insert([spaceData])
    .select()
    .single();

  if (spaceError) throw spaceError;

  if (data.type === 'room') {
    const roomProperties = {
      space_id: space.id,
      room_type: (data as any).roomType,
      phone_number: (data as any).phoneNumber,
      current_function: (data as any).currentFunction,
      is_storage: (data as any).isStorage || false,
      storage_type: (data as any).isStorage ? (data as any).storageType : null,
      storage_capacity: (data as any).isStorage ? parseFloat((data as any).storageCapacity) || null : null,
      parent_room_id: (data as any).parentRoomId,
    };

    const { error: roomError } = await supabase
      .from('room_properties')
      .insert([roomProperties]);

    if (roomError) throw roomError;
  }

  // Create space connection if specified
  if ('connections' in data && data.connections?.toSpaceId) {
    const { error: connectionError } = await supabase
      .from('space_connections')
      .insert([{
        from_space_id: space.id,
        to_space_id: data.connections.toSpaceId,
        space_type: data.type,
        connection_type: data.connections.connectionType,
        direction: data.connections.direction,
        status: 'active',
        connection_status: 'active'
      }]);

    if (connectionError) throw connectionError;
  }

  return space;
}
