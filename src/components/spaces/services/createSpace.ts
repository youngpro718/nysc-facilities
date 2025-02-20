
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../schemas/createSpaceSchema";

export async function createSpace(data: CreateSpaceFormData) {
  console.log('Creating space with data:', data);
  
  // Create base space record
  const spaceData = {
    name: data.name,
    type: data.type,
    floor_id: data.floorId,
    status: data.status,
    room_number: data.type === 'room' ? data.roomNumber : null,
    position: { x: 0, y: 0 },
    size: data.type === 'door' ? 
      { width: 60, height: 20 } : 
      { width: 150, height: 100 },
    rotation: 0
  };

  const { data: space, error: spaceError } = await supabase
    .from('new_spaces')
    .insert([spaceData])
    .select()
    .single();

  if (spaceError) throw spaceError;

  // Add type-specific properties
  if (data.type === 'room') {
    const { error: roomError } = await supabase
      .from('room_properties')
      .insert([{
        space_id: space.id,
        room_type: data.roomType,
        phone_number: data.phoneNumber,
        current_function: data.currentFunction,
        is_storage: data.isStorage,
        storage_type: data.isStorage ? data.storageType : null,
        storage_capacity: data.storageCapacity,
        parent_room_id: data.parentRoomId
      }]);

    if (roomError) throw roomError;
  } else if (data.type === 'hallway') {
    const { error: hallwayError } = await supabase
      .from('hallway_properties')
      .insert([{
        space_id: space.id,
        section: data.section,
        traffic_flow: 'two_way',
        accessibility: 'fully_accessible',
        maintenance_priority: 'low'
      }]);

    if (hallwayError) throw hallwayError;
  } else if (data.type === 'door') {
    const { error: doorError } = await supabase
      .from('door_properties')
      .insert([{
        space_id: space.id,
        security_level: data.securityLevel,
        passkey_enabled: data.passkeyEnabled
      }]);

    if (doorError) throw doorError;
  }

  // Create space connection if specified
  if (data.connections?.toSpaceId) {
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
